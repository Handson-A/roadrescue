import { createClient, createServiceClient } from '@/lib/supabase/server'
import { systemAutoCancelRequest } from '@/lib/request'
import { normalizeString } from '@/lib/rescueLifecycle'
import { NextResponse } from 'next/server'
import { sanitizeInput } from '@/lib/validate'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    const auth = await supabase.auth.getUser()
    if (auth.error || !auth.data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await req.json()
    const body = sanitizeInput(rawBody)

    const requestId = body.requestId || body.id
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
    }

    const reason = normalizeString(
      body.reason ?? body.cancellationReason ?? body.cancellation_reason ?? 'mechanic inactivity timeout'
    )

    const result = await systemAutoCancelRequest(serviceSupabase, {
      requestId,
      reason,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error('[POST /api/requests/auto-cancel]', err.message)
    const statusCode = err.message.includes('not found')
      ? 404
      : err.message.includes('terminal') || err.message.includes('Cannot')
        ? 409
        : err.message.includes('required') || err.message.includes('invalid')
          ? 400
          : 500

    return NextResponse.json({ error: err.message }, { status: statusCode })
  }
}
