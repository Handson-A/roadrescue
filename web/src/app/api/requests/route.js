import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requestLimiter } from '@/lib/rateLimit'
import { sendNotificationEmail } from '@/lib/email'

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous'
    const limit = requestLimiter(ip)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      )
    }

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

    const vehicleImageUrl = body.vehicle_image_url || body.vehicleImageUrl || null

    // 1. Insert the rescue request row immediately
    const { data: request, error: requestError } = await supabase
      .from('rescue_requests')
      .insert({
        driver_id: user.id,
        status: 'pending',
        service_type: serviceType,
        incident_location: `POINT(${incidentLng} ${incidentLat})`,
        incident_address: body.incidentAddress,
        problem_description: body.problemDescription,
        vehicle_make: body.vehicleMake,
        vehicle_model: body.vehicleModel,
        vehicle_year: body.vehicleYear ? Number(body.vehicleYear) : null,
        vehicle_color: body.vehicleColor,
        vehicle_plate: body.vehiclePlate,
        vehicle_image_url: vehicleImageUrl,
        ai_diagnostic_result: body.aiDiagnosticResult || null,
      })
      .select()
      .single()

    if (requestError) throw requestError

    // 2. Broadcast the ticket live to the Supabase realtime channel (non-blocking)
    const channel = supabase.channel('rescue-requests')
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'new_request',
          payload: request
        })
      }
    })

    // 3. Decoupled asynchronous matching & notifications logic
    Promise.resolve().then(async () => {
      try {
        const { data: nearbyMechanics, error: matchError } = await serviceSupabase.rpc('get_nearby_verified_mechanics', {
          request_latitude: Number(incidentLat),
          request_longitude: Number(incidentLng),
          search_radius_km: 10.0,
        })

        if (matchError) {
          console.error('[BACKGROUND MATCH ERROR]:', matchError.message)
          return
        }

        if (nearbyMechanics && nearbyMechanics.length > 0) {
          const notifications = nearbyMechanics.map((mechanic) => ({
            profile_id: mechanic.user_id,
            type: 'new_request',
            title: 'New rescue request',
            body: `New ${serviceType} request ${mechanic.distance_km}km away — ${body.incidentAddress || 'location pinned'}`,
          }))

          const { error: notifError } = await serviceSupabase
            .from('notifications')
            .insert(notifications)

          if (notifError) {
            console.error('[BACKGROUND NOTIFICATIONS INSERT ERROR]:', notifError.message)
          }

          // Send emails asynchronously
          nearbyMechanics.forEach((mechanic) => {
            sendNotificationEmail({
              to: mechanic.email || `mechanic-${mechanic.user_id}@roadrescue.com`,
              subject: `🚗 New ${serviceType} Request ${mechanic.distance_km}km away!`,
              type: 'new_request',
              data: {
                mechanicName: mechanic.full_name,
                issueDescription: body.problemDescription,
                location: body.incidentAddress || 'Location pinned',
                distance: `${mechanic.distance_km} km`,
                appUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue-gh.vercel.app'}/dashboard/mechanic/requests`,
              },
            }).catch((err) => {
              console.warn(`Email failed for mechanic ${mechanic.user_id}:`, err)
            })
          })
        }
      } catch (bgError) {
        console.error('[BACKGROUND DISPATCH FAULT]:', bgError.message)
      }
    })

    return NextResponse.json({ request, notifiedCount: 0 }, { status: 201 })

  } catch (err) {
    console.error('[POST /api/requests]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
