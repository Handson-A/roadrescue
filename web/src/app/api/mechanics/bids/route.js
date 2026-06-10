import {
  getRequestContext,
  insertNotifications,
  normalizeString,
  NOTIFICATION_TYPES,
} from '@/lib/rescueLifecycle'

export async function POST(request) {
  try {
    const context = await getRequestContext()
    if (context.error) {
      return Response.json({ error: context.error }, { status: context.status })
    }

    const { user, profile, serviceClient } = context

    if (profile.role !== 'mechanic' && profile.role !== 'admin') {
      return Response.json({ error: 'Only mechanics can place bids' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const requestId = body.requestId ?? body.request_id
    const proposedPrice = Number(body.proposedPrice ?? body.proposed_price)
    const estimatedArrivalTime = body.estimatedArrivalTime ?? body.estimated_arrival_time ?? null
    const message = normalizeString(body.message)

    if (!requestId || !Number.isFinite(proposedPrice)) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data: rescueRequest, error: requestError } = await serviceClient
      .from('rescue_requests')
      .select('id, driver_id, status')
      .eq('id', requestId)
      .maybeSingle()

    if (requestError) throw requestError
    if (!rescueRequest) {
      return Response.json({ error: 'Request not found' }, { status: 404 })
    }

    if (rescueRequest.status !== 'pending') {
      return Response.json({ error: 'Bids can only be placed on pending requests' }, { status: 409 })
    }

    const { data: mechanicProfile } = await serviceClient
      .from('mechanic_profiles')
      .select('current_location')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: bid, error: bidError } = await serviceClient
      .from('request_bids')
      .insert({
        request_id: requestId,
        mechanic_id: user.id,
        proposed_price: proposedPrice,
        estimated_arrival_time: estimatedArrivalTime ? Number(estimatedArrivalTime) : null,
        message: message || null,
        bid_status: 'pending',
        mechanic_location_snapshot: mechanicProfile?.current_location ?? null,
      })
      .select('*')
      .single()

    if (bidError) {
      if (bidError.code === '23505') {
        return Response.json({ error: 'You already placed a bid on this request' }, { status: 409 })
      }

      throw bidError
    }

    try {
      await insertNotifications(serviceClient, [
        {
          user_id: rescueRequest.driver_id,
          type: NOTIFICATION_TYPES.MECHANIC_BID,
          message: 'A mechanic placed a bid on your rescue request.',
          request_id: requestId,
        },
      ])
    } catch (notificationError) {
      console.warn('Failed to create bid notification:', notificationError)
    }

    return Response.json(
      {
        bid,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Bid placement error:', error)
    return Response.json({ error: 'Failed to place bid' }, { status: 500 })
  }
}
