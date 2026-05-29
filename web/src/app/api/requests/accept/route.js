// web/src/app/api/requests/accept/route.js

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { acceptBid } from '@/lib/bids'
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
    const { requestId, bidId, mechanicId } = body

    if (!requestId || !bidId || !mechanicId) {
      return NextResponse.json(
        { error: 'requestId, bidId, and mechanicId are required' },
        { status: 400 }
      )
    }

    const result = await acceptBid(serviceSupabase, {
      requestId,
      bidId,
      mechanicId,
      driverId: user.id,
    })

    return NextResponse.json(result, { status: 200 })

  } catch (err) {
    console.error('[PATCH /api/requests/accept]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}