// web/src/app/api/requests/status/route.js

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { updateRequestStatus } from '@/lib/requests'
import { NextResponse } from 'next/server'

export async function PATCH(req) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { requestId, newStatus } = body

    if (!requestId || !newStatus) {
      return NextResponse.json(
        { error: 'requestId and newStatus are required' },
        { status: 400 }
      )
    }

    const result = await updateRequestStatus(supabase, serviceSupabase, {
      requestId,
      mechanicId: user.id,
      newStatus,
    })

    return NextResponse.json(result, { status: 200 })

  } catch (err) {
    console.error('[PATCH /api/requests/status]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}