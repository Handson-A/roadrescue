import {
  formatRequestRow,
  getRequestContext,
  insertNotifications,
  isValidTransition,
  normalizeStatus,
  normalizeString,
  NOTIFICATION_TYPES,
} from '@/lib/rescueLifecycle'
import { sendNotificationEmail } from '@/lib/email'

async function fetchRequestDetails(serviceClient, requestId) {
  const { data: request, error: requestError } = await serviceClient
    .from('rescue_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (requestError) throw requestError
  if (!request) return null

  const [driverResult, mechanicResult, mechanicProfileResult, bidsResult] = await Promise.all([
    serviceClient
      .from('profiles')
      .select('id, full_name, phone, avatar_url')
      .eq('id', request.driver_id)
      .maybeSingle(),
    request.mechanic_id
      ? serviceClient
          .from('profiles')
          .select('id, full_name, phone, avatar_url')
          .eq('id', request.mechanic_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    request.mechanic_id
      ? serviceClient
          .from('mechanic_profiles')
          .select('rating_avg, total_jobs, business_name, specializations')
          .eq('user_id', request.mechanic_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    serviceClient
      .from('request_bids')
      .select('*, mechanic:mechanic_id(id, full_name, phone, avatar_url)')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false }),
  ])

  const mechanic = mechanicResult.data
    ? {
        id: mechanicResult.data.id,
        name: mechanicResult.data.full_name,
        phone: mechanicResult.data.phone,
        avatar: mechanicResult.data.avatar_url,
        ratingAvg: mechanicProfileResult.data?.rating_avg ?? null,
        totalJobs: mechanicProfileResult.data?.total_jobs ?? null,
        businessName: mechanicProfileResult.data?.business_name ?? null,
        specializations: mechanicProfileResult.data?.specializations ?? [],
      }
    : null

  const bids = (bidsResult.data ?? []).map((bid) => ({
    ...bid,
    mechanic: bid.mechanic
      ? {
          id: bid.mechanic.id,
          name: bid.mechanic.full_name,
          phone: bid.mechanic.phone,
          avatar: bid.mechanic.avatar_url,
        }
      : null,
  }))

  return formatRequestRow(request, {
    driver: driverResult.data
      ? {
          id: driverResult.data.id,
          name: driverResult.data.full_name,
          phone: driverResult.data.phone,
          avatar: driverResult.data.avatar_url,
        }
      : null,
    assignedMechanic: mechanic,
    bids,
  })
}

export async function GET(request, { params }) {
  try {
    const context = await getRequestContext()
    if (context.error) {
      return Response.json({ error: context.error }, { status: context.status })
    }

    const { user, profile, serviceClient } = context
    const requestId = params?.id

    const { data: rescueRequest, error } = await serviceClient
      .from('rescue_requests')
      .select('id, driver_id, mechanic_id')
      .eq('id', requestId)
      .maybeSingle()

    if (error) throw error
    if (!rescueRequest) {
      return Response.json({ error: 'Request not found' }, { status: 404 })
    }

    const hasAccess =
      profile.role === 'admin' ||
      rescueRequest.driver_id === user.id ||
      rescueRequest.mechanic_id === user.id

    if (!hasAccess) {
      return Response.json({ error: 'Not authorized to view this request' }, { status: 403 })
    }

    const requestDetails = await fetchRequestDetails(serviceClient, requestId)

    return Response.json({ request: requestDetails }, { status: 200 })
  } catch (error) {
    console.error('Request details error:', error)
    return Response.json({ error: 'Failed to load request' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const context = await getRequestContext()
    if (context.error) {
      return Response.json({ error: context.error }, { status: context.status })
    }

    const { user, profile, serviceClient } = context
    const requestId = params?.id
    const body = await request.json().catch(() => ({}))
    const nextStatus = normalizeStatus(body.status)
    const bidId = body.bidId ?? body.bid_id ?? null
    const completionNotes = normalizeString(body.completionNotes ?? body.completion_notes)

    if (!nextStatus) {
      return Response.json({ error: 'Missing status' }, { status: 400 })
    }

    const { data: rescueRequest, error: requestError } = await serviceClient
      .from('rescue_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()

    if (requestError) throw requestError
    if (!rescueRequest) {
      return Response.json({ error: 'Request not found' }, { status: 404 })
    }

    if (nextStatus === 'accepted') {
      if (profile.role !== 'driver' && profile.role !== 'admin') {
        return Response.json({ error: 'Only drivers can accept bids' }, { status: 403 })
      }

      if (!bidId) {
        return Response.json({ error: 'Missing bidId' }, { status: 400 })
      }

      const { data: acceptanceResult, error: acceptanceError } = await serviceClient.rpc(
        'accept_request_bid',
        {
          p_request_id: requestId,
          p_bid_id: bidId,
          p_driver_id: user.id,
        }
      )

      if (acceptanceError) {
        return Response.json({ error: acceptanceError.message }, { status: 400 })
      }

      const selectedMechanicId = acceptanceResult?.[0]?.mechanic_id
      if (selectedMechanicId) {
        const { error: availabilityError } = await serviceClient
          .from('mechanic_profiles')
          .update({ is_available: false })
          .eq('user_id', selectedMechanicId)

        if (availabilityError) {
          console.warn('Failed to mark mechanic unavailable:', availabilityError)
        }
      }

      const { data: allBids, error: bidsError } = await serviceClient
        .from('request_bids')
        .select('id, mechanic_id, bid_status, mechanic:mechanic_id(full_name)')
        .eq('request_id', requestId)

      if (bidsError) throw bidsError

      const notifications = (allBids ?? []).flatMap((bid) => {
        if (bid.bid_status === 'accepted' && bid.mechanic_id) {
          return [
            {
              user_id: bid.mechanic_id,
              type: NOTIFICATION_TYPES.BID_ACCEPTED,
              message: 'Your bid was accepted. Head to the rescue location.',
              request_id: requestId,
            },
          ]
        }

        if (bid.bid_status === 'missed' && bid.mechanic_id) {
          return [
            {
              user_id: bid.mechanic_id,
              type: NOTIFICATION_TYPES.BID_MISSED,
              message: 'The driver selected another mechanic for this request.',
              request_id: requestId,
            },
          ]
        }

        return []
      })

      try {
        await insertNotifications(serviceClient, notifications)
      } catch (notificationError) {
        console.warn('Failed to create bid acceptance notifications:', notificationError)
      }

      // Send emails for bid acceptance/missed
      const { data: allProfiles } = await serviceClient
        .from('profiles')
        .select('id, email, full_name')
        .in(
          'id',
          allBids.map((b) => b.mechanic_id)
        )

      const profileMap = Object.fromEntries(allProfiles.map((p) => [p.id, p]))

      allBids.forEach((bid) => {
        if (bid.bid_status === 'accepted' && bid.mechanic_id) {
          const mechanic = profileMap[bid.mechanic_id]
          if (mechanic?.email) {
            sendNotificationEmail({
              to: mechanic.email,
              subject: '✅ Your Bid Was Accepted!',
              type: 'bid_accepted',
              data: {
                mechanicName: mechanic.full_name,
                driverName: rescueRequest.driver?.name || 'Driver',
                location: rescueRequest.incident_address || 'Rescue location',
                bidAmount: bid.proposed_price || 'N/A',
                appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue.com'}/requests/${requestId}`,
              },
            }).catch((err) => console.warn('Email send failed:', err))
          }
        }

        if (bid.bid_status === 'missed' && bid.mechanic_id) {
          const mechanic = profileMap[bid.mechanic_id]
          if (mechanic?.email) {
            sendNotificationEmail({
              to: mechanic.email,
              subject: 'ℹ️ Request Assigned to Another Mechanic',
              type: 'bid_missed',
              data: {
                mechanicName: mechanic.full_name,
                appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue.com'}/requests`,
              },
            }).catch((err) => console.warn('Email send failed:', err))
          }
        }
      })

      const requestDetails = await fetchRequestDetails(serviceClient, requestId)

      return Response.json(
        {
          request: requestDetails,
          acceptedBidId: bidId,
        },
        { status: 200 }
      )
    }

    if (profile.role !== 'mechanic' && profile.role !== 'admin') {
      return Response.json({ error: 'Only mechanics can update rescue status' }, { status: 403 })
    }

    if (rescueRequest.mechanic_id !== user.id && profile.role !== 'admin') {
      return Response.json({ error: 'You are not assigned to this request' }, { status: 403 })
    }

    if (!isValidTransition(rescueRequest.status, nextStatus)) {
      return Response.json({ error: 'Invalid status transition' }, { status: 400 })
    }

    const updates = {
      status: nextStatus,
    }

    if (nextStatus === 'en_route') {
      updates.en_route_at = rescueRequest.en_route_at ?? new Date().toISOString()
    }

    if (nextStatus === 'arrived') {
      updates.arrived_at = rescueRequest.arrived_at ?? new Date().toISOString()
    }

    if (nextStatus === 'in_progress') {
      updates.started_at = rescueRequest.started_at ?? new Date().toISOString()
    }

    if (nextStatus === 'completed') {
      updates.completed_at = new Date().toISOString()
      if (completionNotes) {
        updates.completion_notes = completionNotes
      }
    }

    const { error: updateError } = await serviceClient
      .from('rescue_requests')
      .update(updates)
      .eq('id', requestId)

    if (updateError) throw updateError

    if (nextStatus === 'completed' && rescueRequest.mechanic_id) {
      const { error: mechanicAvailabilityError } = await serviceClient
        .from('mechanic_profiles')
        .update({ is_available: true })
        .eq('user_id', rescueRequest.mechanic_id)

      if (mechanicAvailabilityError) {
        console.warn('Failed to mark mechanic available:', mechanicAvailabilityError)
      }
    }

    const notifications = []

    if (nextStatus === 'en_route') {
      notifications.push({
        user_id: rescueRequest.driver_id,
        type: NOTIFICATION_TYPES.MECHANIC_EN_ROUTE,
        message: 'Your mechanic is on the way.',
        request_id: requestId,
      })
    }

    if (nextStatus === 'arrived') {
      notifications.push({
        user_id: rescueRequest.driver_id,
        type: NOTIFICATION_TYPES.MECHANIC_ARRIVED,
        message: 'Your mechanic has arrived at the scene.',
        request_id: requestId,
      })
    }

    if (nextStatus === 'completed') {
      notifications.push({
        user_id: rescueRequest.driver_id,
        type: NOTIFICATION_TYPES.JOB_COMPLETED,
        message: 'Your rescue job is complete. Please leave a rating.',
        request_id: requestId,
      })
    }

    try {
      await insertNotifications(serviceClient, notifications)
    } catch (notificationError) {
      console.warn('Failed to create status notifications:', notificationError)
    }

    // Send emails for status transitions
    if (nextStatus === 'en_route') {
      const { data: driver } = await serviceClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', rescueRequest.driver_id)
        .single()

      if (driver?.email) {
        sendNotificationEmail({
          to: driver.email,
          subject: '🚗 Your Mechanic Is On The Way',
          type: 'mechanic_en_route',
          data: {
            driverName: driver.full_name,
            mechanicName: rescueRequest.assignedMechanic?.name || 'Mechanic',
            estimatedArrival: '10-15 minutes',
            appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue.com'}/requests/${requestId}`,
          },
        }).catch((err) => console.warn('Email send failed:', err))
      }
    }

    if (nextStatus === 'completed') {
      const { data: driver } = await serviceClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', rescueRequest.driver_id)
        .single()

      if (driver?.email) {
        sendNotificationEmail({
          to: driver.email,
          subject: '🎉 Your Rescue Service Is Complete!',
          type: 'job_completed',
          data: {
            driverName: driver.full_name,
            mechanicName: rescueRequest.assignedMechanic?.name || 'Mechanic',
            appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue.com'}/requests/${requestId}`,
          },
        }).catch((err) => console.warn('Email send failed:', err))
      }
    }

    const requestDetails = await fetchRequestDetails(serviceClient, requestId)

    return Response.json(
      {
        request: requestDetails,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Request update error:', error)
    return Response.json({ error: 'Failed to update request' }, { status: 500 })
  }
}
