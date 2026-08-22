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

    // 2. Find nearby mechanics using PostGIS geospatial function
    const { data: nearbyMechanics, error: matchError } = await supabase.rpc('get_nearby_verified_mechanics', {
      lat: incidentLat,
      lng: incidentLng,
      radius_km: DEFAULT_SEARCH_RADIUS_KM,
    })

    if (matchError) throw matchError

    // 3. If no mechanics found, still return request (driver sees "searching" state)
    if (!nearbyMechanics || nearbyMechanics.length === 0) {
      return { request, notifiedCount: 0 }
    }

    // 4. Create notifications for each nearby mechanic
    // Use service role because RLS blocks inserts from client
    const notifications = nearbyMechanics.map((mechanic) => ({
      profile_id: mechanic.user_id,
      type: NOTIFICATION_TYPE.NEW_REQUEST,
      title: 'New rescue request',
      body: `New ${serviceType} request ${mechanic.distance_km}km away — ${incidentAddress || 'location pinned'}`,
      request_id: requestId,
    }))

    try {
      await insertNotifications(serviceSupabase, notifications)
    } catch (notifError) {
      console.error('[BACKGROUND NOTIFICATIONS INSERT ERROR]:', notifError.message)
    }

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
          appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue-gh.vercel.app'}/dashboard/mechanic/requests`,
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
          .select('rating_avg, rating_count, business_name, specializations, location_label, is_available, current_status')
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
                is_available: mechanicProfile.data.is_available,
                current_status: mechanicProfile.data.current_status,
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

      if (actorRole === 'mechanic') {
        const { data: mechProfile, error: mechErr } = await serviceSupabase
          .from('mechanic_profiles')
          .select('verification_status')
          .eq('user_id', actorId)
          .maybeSingle()

        if (mechErr) throw mechErr

        const verificationStatus = mechProfile?.verification_status || 'pending'

        if (verificationStatus !== 'approved') {
          throw new Error('Mechanic account is not verified to accept requests')
        }
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

        const forbiddenStatuses = [
          REQUEST_STATUS.EN_ROUTE,
          REQUEST_STATUS.ARRIVED,
          REQUEST_STATUS.IN_PROGRESS,
        ]
        if (forbiddenStatuses.includes(request.status)) {
          throw new Error('Not authorized to cancel this request once the mechanic is en route, has arrived, or has started work')
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

    // ============================================================================
    // STATE TRANSITION WRITE
    // ============================================================================
    const updatePayload = { status: newStatus }

    if (newStatus === REQUEST_STATUS.ACCEPTED) {
      if (request.mechanic_id && request.mechanic_id !== 'null') {
        throw new Error('Another mechanic already accepted this request')
      }
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
      if (completionNotes) updatePayload.completion_notes = completionNotes
      if (performedServices?.length) updatePayload.performed_services = performedServices
    }

    if (newStatus === REQUEST_STATUS.CANCELLED) {
      updatePayload.cancelled_at = new Date().toISOString()
      updatePayload.cancelled_by = actorId
      updatePayload.cancellation_reason = cancellationReason || null
    }

    // Use .select() so Supabase returns the updated rows.
    // If RLS or a trigger silently blocks the write, `updatedRows` will be an
    // empty array instead of throwing — we catch that explicitly below.
    const { data: updatedRows, error: updateError } = await serviceSupabase
      .from('rescue_requests')
      .update(updatePayload)
      .eq('id', requestId)
      .select('id, status, mechanic_id')

    if (updateError) {
      console.error('[updateRequestStatus] DB update error:', updateError)
      throw updateError
    }

    // 0 rows updated = RLS blocked the write or wrong requestId
    if (!updatedRows || updatedRows.length === 0) {
      // Diagnose: re-fetch to see the current state
      const { data: currentRow } = await serviceSupabase
        .from('rescue_requests')
        .select('id, status, mechanic_id')
        .eq('id', requestId)
        .maybeSingle()

      console.error('[updateRequestStatus] 0 rows affected. Current row:', currentRow)

      if (!currentRow) throw new Error(`Request ${requestId} not found — cannot update status`)
      throw new Error(
        `Status update blocked (0 rows affected). ` +
        `Current status: "${currentRow.status}", attempted: "${newStatus}". ` +
        `This is usually an RLS policy blocking the service-role write — ` +
        `check that createServiceClient() uses SUPABASE_SERVICE_ROLE_KEY and not the anon key.`
      )
    }

    const verifiedRequest = updatedRows[0]

    if (verifiedRequest.status !== newStatus) {
      throw new Error(
        `Status write failed: expected "${newStatus}" but database has "${verifiedRequest.status}"`
      )
    }

    // ── FIX 1: mechanic availability update ──
    if (newStatus === REQUEST_STATUS.ACCEPTED) {
      await serviceSupabase
        .from('mechanic_profiles')
        .update({ is_available: true, current_status: null })
        .eq('user_id', actorId)
        .then(({ error: availabilityError }) => {
          if (availabilityError) console.warn('Failed to mark mechanic online:', availabilityError)
        })
    }

    if (
      request.mechanic_id &&
      (newStatus === REQUEST_STATUS.COMPLETED || newStatus === REQUEST_STATUS.CANCELLED)
    ) {
      await serviceSupabase
        .from('mechanic_profiles')
        .update({ is_available: true })
        .eq('user_id', request.mechanic_id)
        .then(({ error: availabilityError }) => {
          if (availabilityError) console.warn('Failed to release mechanic:', availabilityError)
        })
    }

    // ── FIX 2: notifications — were unreachable (after early return) ──
    const notification = statusNotificationMap[newStatus]
    const notifications = []

    if (notification?.type) {
      if (newStatus === REQUEST_STATUS.CANCELLED) {
        if (request.mechanic_id && request.driver_id === actorId) {
          notifications.push({
            profile_id: request.mechanic_id,
            type: notification.type,
            title: 'Request cancelled',
            body: 'The driver cancelled this rescue request.',
            request_id: request.id,
          })
        } else if (request.driver_id && request.mechanic_id === actorId) {
          notifications.push({
            profile_id: request.driver_id,
            type: notification.type,
            title: 'Request cancelled',
            body: 'The assigned mechanic cancelled this rescue request.',
            request_id: request.id,
          })
        } else if (actorRole === 'admin') {
          if (request.driver_id) {
            notifications.push({
              profile_id: request.driver_id,
              type: notification.type,
              title: 'Request cancelled',
              body: 'An admin cancelled this rescue request.',
              request_id: request.id,
            })
          }
          if (request.mechanic_id) {
            notifications.push({
              profile_id: request.mechanic_id,
              type: notification.type,
              title: 'Request cancelled',
              body: 'An admin cancelled this rescue request.',
              request_id: request.id,
            })
          }
        }
      } else {
        notifications.push({
          profile_id: request.driver_id,
          type: notification.type,
          title: 'Request update',
          body: notification.message,
          request_id: request.id,
        })
      }
    }

    if (newStatus === REQUEST_STATUS.COMPLETED) {
      try {
        const { data: admins } = await serviceSupabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
        if (admins && admins.length > 0) {
          admins.forEach(adm => {
            notifications.push({
              profile_id: adm.id,
              type: NOTIFICATION_TYPE.SYSTEM,
              title: 'Request Completed',
              body: `Rescue request #${request.id.slice(0, 8)} was successfully completed by mechanic.`,
              request_id: request.id,
            })
          })
        }
      } catch (adminFetchErr) {
        console.warn('Failed to fetch admins for request completed notification:', adminFetchErr)
      }
    }

    try {
      await insertNotifications(serviceSupabase, notifications)
    } catch (notificationError) {
      console.warn('Notification insert failed:', notificationError)
    }

    // ── FIX 3: email sends — were unreachable (after early return) ──
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
            appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue-gh.vercel.app'}/dashboard/driver/request/${requestId}`,
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
              appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue-gh.vercel.app'}/requests`,
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
              appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue-gh.vercel.app'}/requests`,
            },
          }).catch((err) => console.warn('Email send failed:', err))
        }
      }
    }

    // Single, correct final return
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
export async function submitRating(supabase, payload) {
  const { requestId, driverId, rating, review } = payload

  try {
    const { data: request, error: requestError } = await supabase
      .from('rescue_requests')
      .select('id, driver_id, mechanic_id, status')
      .eq('id', requestId)
      .eq('driver_id', driverId)
      .eq('status', REQUEST_STATUS.COMPLETED)
      .maybeSingle()

    if (requestError) throw requestError
    if (!request) throw new Error('Request not found or not completed')

    const { error: insertError } = await supabase
      .from('request_reviews')
      .insert({
        request_id: requestId,
        driver_id: driverId,
        mechanic_id: request.mechanic_id,
        rating: Math.max(1, Math.min(5, rating)),
        review: review || null,
      })

    if (insertError) throw insertError

    const { data: allReviews, error: fetchError } = await supabase
      .from('request_reviews')
      .select('rating')
      .eq('mechanic_id', request.mechanic_id)

    if (fetchError) throw fetchError

    const avgRating =
      allReviews && allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0

    const { error: updateError } = await supabase
      .from('mechanic_profiles')
      .update({
        rating_avg: Math.round(avgRating * 100) / 100,
        rating_count: allReviews?.length || 0,
      })
      .eq('user_id', request.mechanic_id)

    if (updateError) throw updateError

    try {
      await insertNotifications(supabase, [{
        profile_id: driverId,
        type: NOTIFICATION_TYPE.SYSTEM,
        title: 'Rating Submitted',
        body: `Your review of ${rating} stars was successfully recorded. Thank you for your feedback!`,
        request_id: requestId,
      }])
    } catch (e) {
      console.warn('Failed to insert rating notification for driver:', e)
    }

    return { success: true, newAvgRating: Math.round(avgRating * 100) / 100 }
  } catch (error) {
    console.error('Error submitting rating:', error)
    throw error
  }
}