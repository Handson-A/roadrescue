/**
 * request.js — DEFINITIVE VERSION
 * All rescue request operations (create, update status, cancel, rate)
 * 
 * These functions are called from API route handlers, NOT directly from components.
 * They handle:
 * - Request creation with geospatial matching
 * - Status transitions with validation
 * - Request cancellation with mechanic notifications
 * - Driver ratings with dynamic mechanic average calculation
 */

import { DEFAULT_SEARCH_RADIUS_KM, NOTIFICATION_TYPE, REQUEST_STATUS } from '@/lib/constants'
import { formatRequestRow, insertNotifications, isValidTransition, normalizeStatus } from '@/lib/rescueLifecycle'
import { sendNotificationEmail } from '@/lib/email'

// ============================================================================
// CREATE RESCUE REQUEST
// ============================================================================
// Called from POST /api/requests
// - supabase: server client with user JWT context
// - serviceSupabase: service role client (bypasses RLS for notifications)
export async function createRescueRequest(supabase, serviceSupabase, payload) {
  const {
    driverId,
    incidentLat,
    incidentLng,
    incidentAddress,
    problemDescription,
    serviceType,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    vehiclePlate,
    aiDiagnosticResult,
  } = payload

  // Extract vehicle image URL from payload (passed as vehicle_image_url)
  const vehicleImageUrl = payload.vehicle_image_url || null

  try {
    // 1. Insert the rescue request row
    const { data: request, error: requestError } = await supabase
      .from('rescue_requests')
      .insert({
        driver_id: driverId,
        status: REQUEST_STATUS.PENDING,
        service_type: serviceType,
        // PostGIS requires POINT(longitude, latitude) — lng first, always
        incident_location: `POINT(${incidentLng} ${incidentLat})`,
        incident_address: incidentAddress,
        problem_description: problemDescription,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear,
        vehicle_color: vehicleColor,
        vehicle_plate: vehiclePlate,
        vehicle_image_url: vehicleImageUrl,
        ai_diagnostic_result: aiDiagnosticResult || null,
      })
      .select()
      .single()

    if (requestError) throw requestError

    // 2. Find nearby verified mechanics using PostGIS geospatial function
    const { data: nearbyMechanics, error: matchError } = await supabase.rpc('get_nearby_verified_mechanics', {
      request_latitude: incidentLat,
      request_longitude: incidentLng,
      search_radius_km: DEFAULT_SEARCH_RADIUS_KM,
    })

    if (matchError) throw matchError

    // 3. If no mechanics found, still return request (driver sees "searching" state)
    if (!nearbyMechanics || nearbyMechanics.length === 0) {
      return { request, notifiedCount: 0 }
    }

    // 4. Create notifications for each nearby mechanic
    // Use service role because RLS blocks inserts from client
    const notifications = nearbyMechanics.map((mechanic) => ({
      user_id: mechanic.user_id,
      type: NOTIFICATION_TYPE.NEW_REQUEST,
      message: `New ${serviceType} request ${mechanic.distance_km}km away — ${incidentAddress || 'location pinned'}`,
      request_id: request.id,
    }))

    const { error: notifError } = await serviceSupabase
      .from('notifications')
      .insert(notifications)

    if (notifError) throw notifError

    // 5. Send email notifications (non-blocking, best-effort)
    nearbyMechanics.forEach((mechanic) => {
      sendNotificationEmail({
        to: mechanic.email || `mechanic-${mechanic.user_id}@roadrescue.com`,
        subject: `🚗 New ${serviceType} Request ${mechanic.distance_km}km away!`,
        type: 'new_request',
        data: {
          mechanicName: mechanic.full_name,
          issueDescription: problemDescription,
          location: incidentAddress || 'Location pinned',
          distance: `${mechanic.distance_km} km`,
          appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue.com'}/dashboard/mechanic/requests`,
        },
      }).catch((err) => {
        console.warn(`Email failed for mechanic ${mechanic.user_id}:`, err)
      })
    })

    return { request, notifiedCount: nearbyMechanics.length }
  } catch (error) {
    console.error('Error creating rescue request:', error)
    throw error
  }
}

// ============================================================================
// UPDATE REQUEST STATUS
// ============================================================================
// All rescue status transitions are validated server-side.
// Clients must call PATCH /api/requests/status instead of updating Supabase directly.
export async function updateRequestStatus(serviceSupabase, payload) {
  const {
    requestId,
    actorId,
    actorRole,
    newStatus: rawNewStatus,
    completionNotes,
    performedServices,
    cancellationReason,
  } = payload

  const newStatus = normalizeStatus(rawNewStatus)
  const knownStatuses = new Set(Object.values(REQUEST_STATUS))

  const statusNotificationMap = {
    [REQUEST_STATUS.ACCEPTED]: {
      type: NOTIFICATION_TYPE.MECHANIC_ACCEPTED,
      message: 'A mechanic accepted your rescue request.',
    },
    [REQUEST_STATUS.EN_ROUTE]: {
      type: NOTIFICATION_TYPE.MECHANIC_EN_ROUTE,
      message: 'Your mechanic is on the way — track them on the map',
    },
    [REQUEST_STATUS.ARRIVED]: {
      type: NOTIFICATION_TYPE.MECHANIC_ARRIVED,
      message: 'Your mechanic has arrived at your location',
    },
    [REQUEST_STATUS.IN_PROGRESS]: { type: null, message: null },
    [REQUEST_STATUS.COMPLETED]: {
      type: NOTIFICATION_TYPE.JOB_COMPLETED,
      message: 'Job completed — please rate your mechanic',
    },
    [REQUEST_STATUS.CANCELLED]: {
      type: NOTIFICATION_TYPE.REQUEST_CANCELLED,
      message: 'This rescue request was cancelled.',
    },
  }

  async function fetchRequestDetails(requestIdToFetch) {
    const { data: request, error: requestError } = await serviceSupabase
      .from('rescue_requests')
      .select('*')
      .eq('id', requestIdToFetch)
      .maybeSingle()

    if (requestError) throw requestError
    if (!request) throw new Error('Request not found')

    const { data: driver } = await serviceSupabase
      .from('profiles')
      .select('id, full_name, phone, avatar_url')
      .eq('id', request.driver_id)
      .maybeSingle()

    const mechanicPromise = request.mechanic_id
      ? serviceSupabase
          .from('profiles')
          .select('id, full_name, phone, avatar_url')
          .eq('id', request.mechanic_id)
          .maybeSingle()
      : Promise.resolve({ data: null })

    const mechanicProfilePromise = request.mechanic_id
      ? serviceSupabase
          .from('mechanic_profiles')
          .select('rating_avg, total_jobs, business_name, specializations, location_label')
          .eq('user_id', request.mechanic_id)
          .maybeSingle()
      : Promise.resolve({ data: null })

    const [mechanic, mechanicProfile] = await Promise.all([
      mechanicPromise,
      mechanicProfilePromise,
    ])

    const assignedMechanic = mechanic?.data
      ? {
          ...mechanic.data,
          mechanic_profiles: mechanicProfile?.data
            ? {
                business_name: mechanicProfile.data.business_name,
                location_label: mechanicProfile.data.location_label,
              }
            : null,
        }
      : null

    return formatRequestRow(request, {
      driver: driver?.data
        ? {
            id: driver.data.id,
            full_name: driver.data.full_name,
            phone: driver.data.phone,
            avatar_url: driver.data.avatar_url,
          }
        : null,
      assignedMechanic,
    })
  }

  try {
    if (!requestId) {
      throw new Error('requestId is required')
    }

    if (!actorId || !actorRole) {
      throw new Error('actorId and actorRole are required')
    }

    if (!knownStatuses.has(newStatus)) {
      throw new Error('Invalid status')
    }

    const { data: request, error: fetchError } = await serviceSupabase
      .from('rescue_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!request) throw new Error('Request not found')

    const isAcceptedTransition = newStatus === REQUEST_STATUS.ACCEPTED
    const isCancelledTransition = newStatus === REQUEST_STATUS.CANCELLED

    if (isAcceptedTransition) {
      if (actorRole !== 'mechanic' && actorRole !== 'admin') {
        throw new Error('Only mechanics can accept requests')
      }

      if (request.status !== REQUEST_STATUS.PENDING) {
        throw new Error('Request is no longer available')
      }

      if (request.mechanic_id) {
        throw new Error('Another mechanic already accepted this request')
      }
    } else {
      if (actorRole !== 'mechanic' && actorRole !== 'admin' && actorRole !== 'driver') {
        throw new Error('Not authorized to update rescue status')
      }

      if (isCancelledTransition) {
        const isDriverOwner = actorRole === 'driver' && request.driver_id === actorId
        const isAssignedMechanic = actorRole === 'mechanic' && request.mechanic_id === actorId
        const isAdmin = actorRole === 'admin'

        if (!isDriverOwner && !isAssignedMechanic && !isAdmin) {
          throw new Error('Not authorized to cancel this request')
        }
      } else {
        if (actorRole !== 'mechanic' && actorRole !== 'admin') {
          throw new Error('Only mechanics can update rescue status')
        }

        if (request.mechanic_id !== actorId && actorRole !== 'admin') {
          throw new Error('Not authorized — you do not own this request')
        }
      }
    }

    if (!isValidTransition(request.status, newStatus)) {
      throw new Error(
        `Cannot transition from ${request.status} to ${newStatus} — invalid state change`
      )
    }

    const updatePayload = { status: newStatus }

    if (newStatus === REQUEST_STATUS.ACCEPTED) {
      updatePayload.mechanic_id = actorId
      updatePayload.accepted_at = new Date().toISOString()
    }

    if (newStatus === REQUEST_STATUS.EN_ROUTE) {
      updatePayload.en_route_at = request.en_route_at ?? new Date().toISOString()
    }

    if (newStatus === REQUEST_STATUS.ARRIVED) {
      updatePayload.arrived_at = request.arrived_at ?? new Date().toISOString()
    }

    if (newStatus === REQUEST_STATUS.IN_PROGRESS) {
      updatePayload.started_at = request.started_at ?? new Date().toISOString()
    }

    if (newStatus === REQUEST_STATUS.COMPLETED) {
      updatePayload.completed_at = new Date().toISOString()
      if (completionNotes) {
        updatePayload.completion_notes = completionNotes
      }
      if (performedServices?.length) {
        updatePayload.performed_services = performedServices
      }
    }

    if (newStatus === REQUEST_STATUS.CANCELLED) {
      updatePayload.cancelled_at = new Date().toISOString()
      updatePayload.cancelled_by = actorId
      updatePayload.cancellation_reason = cancellationReason || null
    }

    let updateQuery = serviceSupabase
      .from('rescue_requests')
      .update(updatePayload)
      .eq('id', requestId)
      .eq('status', request.status)

    if (isAcceptedTransition) {
      updateQuery = updateQuery.eq('mechanic_id', null)
    } else if (!isCancelledTransition && actorRole !== 'admin') {
      updateQuery = updateQuery.eq('mechanic_id', request.mechanic_id)
    }

    const { data: updatedRequest, error: updateError } = await updateQuery
      .select('id, status')
      .single()

    if (updateError) throw updateError
    if (!updatedRequest) {
      throw new Error('Request status changed before the update could be applied')
    }

    if (newStatus === REQUEST_STATUS.ACCEPTED) {
      await serviceSupabase
        .from('mechanic_profiles')
        .update({ is_available: false })
        .eq('user_id', actorId)
        .then(({ error: availabilityError }) => {
          if (availabilityError) console.warn('Failed to mark mechanic unavailable:', availabilityError)
        })
    }

    if (
      request.mechanic_id &&
      (newStatus === REQUEST_STATUS.COMPLETED ||
      newStatus === REQUEST_STATUS.CANCELLED)
    ) {
      await serviceSupabase
        .from('mechanic_profiles')
        .update({ is_available: true })
        .eq('user_id', request.mechanic_id)
        .then(({ error: availabilityError }) => {
          if (availabilityError) console.warn('Failed to release mechanic:', availabilityError)
        })
    }

    const notification = statusNotificationMap[newStatus]
    const notifications = []

    if (notification?.type) {
      if (newStatus === REQUEST_STATUS.CANCELLED) {
        if (request.mechanic_id && request.driver_id === actorId) {
          notifications.push({
            user_id: request.mechanic_id,
            type: notification.type,
            message: 'The driver cancelled this rescue request.',
            request_id: requestId,
          })
        } else if (request.driver_id && request.mechanic_id === actorId) {
          notifications.push({
            user_id: request.driver_id,
            type: notification.type,
            message: 'The assigned mechanic cancelled this rescue request.',
            request_id: requestId,
          })
        } else if (actorRole === 'admin') {
          if (request.driver_id) {
            notifications.push({
              user_id: request.driver_id,
              type: notification.type,
              message: 'An admin cancelled this rescue request.',
              request_id: requestId,
            })
          }
          if (request.mechanic_id) {
            notifications.push({
              user_id: request.mechanic_id,
              type: notification.type,
              message: 'An admin cancelled this rescue request.',
              request_id: requestId,
            })
          }
        }
      } else {
        notifications.push({
          user_id: request.driver_id,
          type: notification.type,
          message: notification.message,
          request_id: requestId,
        })
      }
    }

    try {
      await insertNotifications(serviceSupabase, notifications)
    } catch (notificationError) {
      console.warn('Notification insert failed:', notificationError)
    }

    if (newStatus === REQUEST_STATUS.ACCEPTED) {
      const { data: driver } = await serviceSupabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', request.driver_id)
        .single()

      if (driver?.email) {
        sendNotificationEmail({
          to: driver.email,
          subject: '🚗 Mechanic Accepted Your Rescue Request',
          type: 'mechanic_accepted',
          data: {
            driverName: driver.full_name,
            mechanicName: actorRole === 'admin' ? 'An admin' : 'A mechanic',
            location: request.incident_address || 'Rescue location',
            appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue.com'}/dashboard/driver/request/${requestId}`,
          },
        }).catch((err) => console.warn('Email send failed:', err))
      }
    }

    if (newStatus === REQUEST_STATUS.CANCELLED) {
      if (request.mechanic_id && request.driver_id === actorId) {
        const { data: mechanic } = await serviceSupabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', request.mechanic_id)
          .single()

        if (mechanic?.email) {
          sendNotificationEmail({
            to: mechanic.email,
            subject: 'ℹ️ Rescue Request Cancelled',
            type: 'request_cancelled',
            data: {
              mechanicName: mechanic.full_name,
              reason: cancellationReason || 'No reason provided',
              appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue.com'}/requests`,
            },
          }).catch((err) => console.warn('Email send failed:', err))
        }
      }

      if (request.driver_id && request.mechanic_id === actorId) {
        const { data: driver } = await serviceSupabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', request.driver_id)
          .single()

        if (driver?.email) {
          sendNotificationEmail({
            to: driver.email,
            subject: 'ℹ️ Your Rescue Request Was Cancelled',
            type: 'request_cancelled',
            data: {
              driverName: driver.full_name,
              reason: 'Assigned mechanic cancelled the request',
              appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue.com'}/requests`,
            },
          }).catch((err) => console.warn('Email send failed:', err))
        }
      }
    }

    return {
      success: true,
      request: await fetchRequestDetails(requestId),
      newStatus,
    }
  } catch (error) {
    console.error('Error updating request status:', error)
    throw error
  }
}

// ============================================================================
// CANCEL REQUEST
// ============================================================================
// Cancellation is delegated to the validated status transition flow.
export async function cancelRequest(serviceSupabase, payload) {
  const { requestId, driverId, reason } = payload

  return updateRequestStatus(serviceSupabase, {
    requestId,
    actorId: driverId,
    actorRole: 'driver',
    newStatus: REQUEST_STATUS.CANCELLED,
    cancellationReason: reason,
  })
}

// ============================================================================
// SUBMIT DRIVER RATING
// ============================================================================
// Driver rates completed job; updates mechanic's average rating
// Uses full recalculation (not incremental) to avoid drift
export async function submitRating(supabase, payload) {
  const { requestId, driverId, rating, review } = payload

  try {
    // 1. Save rating on the completed request
    const { data: request, error: ratingError } = await supabase
      .from('rescue_requests')
      .update({
        driver_rating: Math.max(1, Math.min(5, rating)), // Clamp 1-5
        driver_review: review || null,
      })
      .eq('id', requestId)
      .eq('driver_id', driverId)
      .eq('status', REQUEST_STATUS.COMPLETED)
      .select('mechanic_id')
      .single()

    if (ratingError) throw ratingError
    if (!request) throw new Error('Request not found or not completed')

    // 2. Recalculate mechanic's average rating from all completed, rated jobs
    const { data: allRatings, error: fetchError } = await supabase
      .from('rescue_requests')
      .select('driver_rating')
      .eq('mechanic_id', request.mechanic_id)
      .eq('status', REQUEST_STATUS.COMPLETED)
      .not('driver_rating', 'is', null)

    if (fetchError) throw fetchError

    // Handle edge case: no ratings yet (avoid division by zero)
    const avgRating =
      allRatings && allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.driver_rating, 0) / allRatings.length
        : 0

    // 3. Update mechanic's profile with new average and total jobs
    const { error: updateError } = await supabase
      .from('mechanic_profiles')
      .update({
        rating_avg: Math.round(avgRating * 100) / 100,
        total_jobs: allRatings?.length || 0,
      })
      .eq('user_id', request.mechanic_id)

    if (updateError) throw updateError

    return { success: true, newAvgRating: Math.round(avgRating * 100) / 100 }
  } catch (error) {
    console.error('Error submitting rating:', error)
    throw error
  }
}