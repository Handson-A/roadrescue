// web/src/app/api/requests/bid/route.js

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { placeBid } from '@/lib/bids'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'mechanic') {
      return NextResponse.json({ error: 'Only mechanics can place bids' }, { status: 403 })
    }

    const body = await req.json()
    const { requestId, estimatedArrivalMinutes } = body

    if (!requestId || !estimatedArrivalMinutes) {
      return NextResponse.json(
        { error: 'requestId and estimatedArrivalMinutes are required' },
        { status: 400 }
      )
    }

    const result = await placeBid(supabase, serviceSupabase, {
      mechanicId: user.id,
      ...body,
    })

    return NextResponse.json(result, { status: 201 })

  } catch (err) {
    console.error('[POST /api/requests/bid]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}