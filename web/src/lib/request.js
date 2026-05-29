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

import { DEFAULT_SEARCH_RADIUS_KM, NOTIFICATION_TYPE, REQUEST_STATUS, BID_STATUS } from '@/lib/constants'
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
        ai_diagnostic_result: aiDiagnosticResult || null,
      })
      .select()
      .single()

    if (requestError) throw requestError

    // 2. Find nearby verified mechanics using PostGIS geospatial function
    const { data: nearbyMechanics, error: matchError } = await supabase.rpc('find_nearby_mechanics', {
      incident_lat: incidentLat,
      incident_lng: incidentLng,
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
// Status transitions: accepted → en_route → arrived → in_progress → completed
// Validates transitions and notifies driver of status changes
export async function updateRequestStatus(supabase, serviceSupabase, payload) {
  const { requestId, mechanicId, newStatus } = payload

  const statusNotificationMap = {
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
  }

  const validTransitions = {
    [REQUEST_STATUS.ACCEPTED]: [REQUEST_STATUS.EN_ROUTE],
    [REQUEST_STATUS.EN_ROUTE]: [REQUEST_STATUS.ARRIVED],
    [REQUEST_STATUS.ARRIVED]: [REQUEST_STATUS.IN_PROGRESS],
    [REQUEST_STATUS.IN_PROGRESS]: [REQUEST_STATUS.COMPLETED],
  }

  try {
    // 1. Fetch current request to validate transition
    const { data: request, error: fetchError } = await supabase
      .from('rescue_requests')
      .select('id, status, driver_id, mechanic_id')
      .eq('id', requestId)
      .single()

    if (fetchError) throw fetchError
    if (!request) throw new Error('Request not found')

    // 2. Verify this mechanic owns the request
    if (request.mechanic_id !== mechanicId) {
      throw new Error('Not authorized — you do not own this request')
    }

    // 3. Validate the transition is legal
    const allowedNext = validTransitions[request.status] || []
    if (!allowedNext.includes(newStatus)) {
      throw new Error(
        `Cannot transition from ${request.status} to ${newStatus} — invalid state change`
      )
    }

    // 4. Build update payload
    const updatePayload = { status: newStatus }
    if (newStatus === REQUEST_STATUS.COMPLETED) {
      updatePayload.completed_at = new Date().toISOString()
    }

    // 5. Update request status
    const { error: updateError } = await supabase
      .from('rescue_requests')
      .update(updatePayload)
      .eq('id', requestId)

    if (updateError) throw updateError

    // 6. Notify driver of status change
    const notif = statusNotificationMap[newStatus]
    if (notif?.type) {
      await serviceSupabase
        .from('notifications')
        .insert({
          user_id: request.driver_id,
          type: notif.type,
          message: notif.message,
          request_id: requestId,
        })
        .catch((err) => console.warn('Notification insert failed:', err))
    }

    return { success: true, newStatus }
  } catch (error) {
    console.error('Error updating request status:', error)
    throw error
  }
}

// ============================================================================
// CANCEL REQUEST
// ============================================================================
// Driver can cancel pending requests only
// Notifies all mechanics who bid on the request
export async function cancelRequest(supabase, serviceSupabase, payload) {
  const { requestId, driverId } = payload

  try {
    // 1. Cancel the request (RLS ensures only owner can cancel pending requests)
    const { data: request, error } = await supabase
      .from('rescue_requests')
      .update({ status: REQUEST_STATUS.CANCELLED })
      .eq('id', requestId)
      .eq('driver_id', driverId)
      .eq('status', REQUEST_STATUS.PENDING)
      .select()
      .single()

    if (error) throw error
    if (!request) throw new Error('Request not found or already accepted — cannot cancel')

    // 2. Find all mechanics with pending bids
    const { data: bids, error: bidError } = await serviceSupabase
      .from('request_bids')
      .select('mechanic_id')
      .eq('request_id', requestId)
      .eq('bid_status', BID_STATUS.PENDING)

    if (bidError) throw bidError

    // 3. Notify each mechanic
    if (bids && bids.length > 0) {
      const notifications = bids.map((bid) => ({
        user_id: bid.mechanic_id,
        type: NOTIFICATION_TYPE.REQUEST_CANCELLED,
        message: 'The driver cancelled this request',
        request_id: requestId,
      }))

      await serviceSupabase
        .from('notifications')
        .insert(notifications)
        .catch((err) => console.warn('Notification insert failed:', err))
    }

    return { success: true }
  } catch (error) {
    console.error('Error cancelling request:', error)
    throw error
  }
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