// web/src/app/api/requests/status/route.js

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { updateRequestStatus } from '@/lib/request'
import { normalizeString } from '@/lib/rescueLifecycle'
import { NextResponse } from 'next/server'

export async function PATCH(req) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    const auth = await supabase.auth.getUser()
    if (auth.error || !auth.data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = auth.data.user

    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const { requestId, newStatus, status } = body
    const requestedStatus = newStatus || status

    if (!requestId || !requestedStatus) {
      return NextResponse.json(
        { error: 'requestId and newStatus are required' },
        { status: 400 }
      )
    }

    const cancellationReason = normalizeString(
      body.reason ?? body.cancellationReason ?? body.cancellation_reason
    )
    const completionNotes = normalizeString(
      body.completionNotes ?? body.completion_notes
    )
    const performedServices = Array.isArray(body.performedServices)
      ? body.performedServices
      : Array.isArray(body.performed_services)
        ? body.performed_services
        : undefined

    const result = await updateRequestStatus(serviceSupabase, {
      requestId,
      actorId: user.id,
      actorRole: profile.role,
      newStatus: requestedStatus,
      completionNotes,
      performedServices,
      cancellationReason,
    })

    return NextResponse.json(result, { status: 200 })

  } catch (err) {
    console.error('[PATCH /api/requests/status]', err.message)
    const statusCode = err.message.includes('not found')
      ? 404
      : err.message.includes('authorized') || err.message.includes('Only')
        ? 403
        : err.message.includes('invalid') || err.message.includes('required')
          ? 400
          : err.message.includes('no longer available') || err.message.includes('already accepted') || err.message.includes('changed before')
            ? 409
            : 500

    return NextResponse.json({ error: err.message }, { status: statusCode })
  }
}