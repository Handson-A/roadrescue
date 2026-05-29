// web/src/lib/bids.js

import { BID_STATUS, NOTIFICATION_TYPE } from '@/lib/constants'

export async function placeBid(supabase, serviceSupabase, payload) {
  const {
    requestId,
    mechanicId,
    estimatedArrivalMinutes,
    mechanicLat,
    mechanicLng,
  } = payload

  // 1. verify the request is still pending before allowing bid
  const { data: request, error: fetchError } = await supabase
    .from('rescue_requests')
    .select('id, status, driver_id')
    .eq('id', requestId)
    .single()

  if (fetchError) throw fetchError

  if (request.status !== 'pending') {
    throw new Error('Request is no longer available')
  }

  // 2. insert the bid
  const { data: bid, error: bidError } = await supabase
    .from('request_bids')
    .insert({
      request_id: requestId,
      mechanic_id: mechanicId,
      bid_status: BID_STATUS.PENDING,
      estimated_arrival_minutes: estimatedArrivalMinutes,
      // snapshot mechanic location at time of bid
      mechanic_location_snapshot: mechanicLat
        ? `POINT(${mechanicLng} ${mechanicLat})`
        : null,
    })
    .select()
    .single()

  if (bidError) {
    // unique constraint violation means mechanic already bid on this
    if (bidError.code === '23505') {
      throw new Error('You have already placed a bid on this request')
    }
    throw bidError
  }

  // 3. fetch mechanic name for the notification message
  const { data: mechanicProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', mechanicId)
    .single()

  // 4. notify the driver that a mechanic responded
  await serviceSupabase
    .from('notifications')
    .insert({
      user_id: request.driver_id,
      type: NOTIFICATION_TYPE.MECHANIC_BID,
      message: `${mechanicProfile.full_name} can help you — arriving in ~${estimatedArrivalMinutes} mins`,
      request_id: requestId,
    })

  return { bid }
}

// web/src/lib/bids.js (continued)

export async function acceptBid(serviceSupabase, payload) {
  const { requestId, bidId, mechanicId, driverId } = payload

  // service role used for this entire flow because we need to:
  // 1. update rescue_requests (mechanic_id, status)
  // 2. update all bids on this request
  // 3. insert notifications for multiple users
  // doing this atomically via service role avoids partial failures

  // 1. assign mechanic to request and move to accepted
  const { error: requestError } = await serviceSupabase
    .from('rescue_requests')
    .update({
      mechanic_id: mechanicId,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('driver_id', driverId)    // safety check — only the driver can do this
    .eq('status', 'pending')      // only accept if still pending

  if (requestError) throw requestError

  // 2. mark the winning bid as accepted
  await serviceSupabase
    .from('request_bids')
    .update({ bid_status: 'accepted' })
    .eq('id', bidId)

  // 3. mark all other bids on this request as missed
  await serviceSupabase
    .from('request_bids')
    .update({ bid_status: 'missed' })
    .eq('request_id', requestId)
    .neq('id', bidId)             // exclude the winning bid

  // 4. fetch all mechanics who placed bids to notify them
  const { data: allBids } = await serviceSupabase
    .from('request_bids')
    .select('mechanic_id, bid_status')
    .eq('request_id', requestId)

  // 5. notify all bidding mechanics of outcome
  const notifications = allBids.map(bid => ({
    user_id: bid.mechanic_id,
    type: bid.bid_status === 'accepted'
      ? NOTIFICATION_TYPE.BID_ACCEPTED
      : NOTIFICATION_TYPE.BID_MISSED,
    message: bid.bid_status === 'accepted'
      ? 'The driver accepted your bid — head to their location'
      : 'The driver chose another mechanic for this job',
    request_id: requestId,
  }))

  await serviceSupabase.from('notifications').insert(notifications)

  return { success: true }
}