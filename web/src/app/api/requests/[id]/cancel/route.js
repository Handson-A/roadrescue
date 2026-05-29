import {
  getRequestContext,
  insertNotifications,
  normalizeString,
  NOTIFICATION_TYPES,
} from '@/lib/rescueLifecycle'
import { sendNotificationEmail } from '@/lib/email'

export async function POST(request, { params }) {
  try {
    const context = await getRequestContext()
    if (context.error) {
      return Response.json({ error: context.error }, { status: context.status })
    }

    const { user, profile, serviceClient } = context
    const requestId = params?.id
    const body = await request.json().catch(() => ({}))
    const cancellationReason = normalizeString(
      body.reason ?? body.cancellationReason ?? body.cancellation_reason
    )

    const { data: rescueRequest, error: requestError } = await serviceClient
      .from('rescue_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()

    if (requestError) throw requestError
    if (!rescueRequest) {
      return Response.json({ error: 'Request not found' }, { status: 404 })
    }

    const isDriverOwner = profile.role === 'driver' && rescueRequest.driver_id === user.id
    const isAssignedMechanic = profile.role === 'mechanic' && rescueRequest.mechanic_id === user.id
    const isAdmin = profile.role === 'admin'

    if (!isDriverOwner && !isAssignedMechanic && !isAdmin) {
      return Response.json({ error: 'Not authorized to cancel this request' }, { status: 403 })
    }

    if (rescueRequest.status === 'completed' || rescueRequest.status === 'cancelled') {
      return Response.json({ error: 'Request is already finished' }, { status: 409 })
    }

    const { error: updateError } = await serviceClient
      .from('rescue_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: cancellationReason || null,
      })
      .eq('id', requestId)

    if (updateError) throw updateError

    if (rescueRequest.mechanic_id) {
      const { error: mechanicAvailabilityError } = await serviceClient
        .from('mechanic_profiles')
        .update({ is_available: true })
        .eq('user_id', rescueRequest.mechanic_id)

      if (mechanicAvailabilityError) {
        console.warn('Failed to release mechanic after cancellation:', mechanicAvailabilityError)
      }
    }

    const { error: bidUpdateError } = await serviceClient
      .from('request_bids')
      .update({
        bid_status: 'withdrawn',
        responded_at: new Date().toISOString(),
      })
      .eq('request_id', requestId)
      .in('bid_status', ['pending', 'accepted'])

    if (bidUpdateError) {
      console.warn('Failed to update bids after cancellation:', bidUpdateError)
    }

    const notifications = []

    if (isDriverOwner && rescueRequest.mechanic_id) {
      notifications.push({
        user_id: rescueRequest.mechanic_id,
        type: NOTIFICATION_TYPES.REQUEST_CANCELLED,
        message: 'The driver cancelled this rescue request.',
        request_id: requestId,
      })
    }

    if (isAssignedMechanic) {
      notifications.push({
        user_id: rescueRequest.driver_id,
        type: NOTIFICATION_TYPES.REQUEST_CANCELLED,
        message: 'The assigned mechanic cancelled this rescue request.',
        request_id: requestId,
      })
    }

    try {
      await insertNotifications(serviceClient, notifications)
    } catch (notificationError) {
      console.warn('Failed to create cancellation notifications:', notificationError)
    }

    // Send cancellation emails
    if (isDriverOwner && rescueRequest.mechanic_id) {
      const { data: mechanic } = await serviceClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', rescueRequest.mechanic_id)
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

    if (isAssignedMechanic) {
      const { data: driver } = await serviceClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', rescueRequest.driver_id)
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

    return Response.json(
      {
        message: 'Request cancelled successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Request cancellation error:', error)
    return Response.json({ error: 'Failed to cancel request' }, { status: 500 })
  }
}
