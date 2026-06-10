import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createRescueRequest } from '@/lib/request'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    // verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // verify user is a driver
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'driver') {
      return NextResponse.json({ error: 'You can only create a request if you signed up as a driver' }, { status: 403 })
    }

    const body = await req.json()

    // basic input validation
    const { incidentLat, incidentLng, serviceType } = body
    if (!incidentLat || !incidentLng || !serviceType) {
      return NextResponse.json(
        { error: 'incidentLat, incidentLng, and serviceType are required' },
        { status: 400 }
      )
    }

    const result = await createRescueRequest(supabase, serviceSupabase, {
      driverId: user.id,
      ...body,
    })

    return NextResponse.json(result, { status: 201 })

  } catch (err) {
    console.error('[POST /api/requests]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
