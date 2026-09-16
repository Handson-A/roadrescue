import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requestLimiter } from '@/lib/rateLimit'
import { sendNotificationEmail } from '@/lib/email'

import { sanitizeInput } from '@/lib/validate'

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

    // 1. Gating Check: Verify if driver already has an active request sequence
    const { data: activeRequests, error: activeError } = await supabase
      .from('rescue_requests')
      .select('id')
      .eq('driver_id', user.id)
      .in('status', ['pending', 'offered', 'accepted', 'en_route', 'arrived', 'in_progress'])
      .limit(1)

    if (activeError) {
      console.error('[ACTIVE REQUEST CHECK FAULT]:', activeError.message)
    } else if (activeRequests && activeRequests.length > 0) {
      return NextResponse.json(
        { error: "Concurrency Lock: You have an ongoing rescue request sequence active. Please clear or abort your existing ticket allocation before issuing a secondary distress call." },
        { status: 400 }
      )
    }

    // 2. Rate-Limiting Check: Max 3 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: hourlyCount, error: countError } = await supabase
      .from('rescue_requests')
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', user.id)
      .gt('created_at', oneHourAgo)

    if (countError) {
      console.error('[HOURLY COUNT CHECK FAULT]:', countError.message)
    } else if (hourlyCount !== null && hourlyCount >= 3) {
      return NextResponse.json(
        { error: "Security Lockout: Maximum request thresholds exceeded. Limit 3 emergency alerts per hour parameters." },
        { status: 429 }
      )
    }

    const rawBody = await req.json()
    const body = sanitizeInput(rawBody)

    // basic input validation
    const { incidentLat, incidentLng, serviceType } = body
    if (!incidentLat || !incidentLng || !serviceType) {
      return NextResponse.json(
        { error: 'incidentLat, incidentLng, and serviceType are required' },
        { status: 400 }
      )
    }

    const preferredMechanicId = body.preferredMechanicId || body.preferred_mechanic_id || null

    // SECURITY & AVAILABILITY GATING FOR TARGETED DISPATCH
    if (preferredMechanicId) {
      const { data: targetMechProfile, error: targetMechErr } = await serviceSupabase
        .from('mechanic_profiles')
        .select('verification_status, is_available')
        .eq('user_id', preferredMechanicId)
        .maybeSingle()

      if (targetMechErr || !targetMechProfile) {
        return NextResponse.json(
          { error: 'The selected mechanic profile could not be verified.', code: 'MECHANIC_NOT_FOUND' },
          { status: 404 }
        )
      }

      // 1. Server-side security check: reject if not approved
      if (targetMechProfile.verification_status !== 'approved') {
        return NextResponse.json(
          { 
            error: 'The selected mechanic is not verified or currently unauthorized for direct dispatch.',
            code: 'MECHANIC_NOT_APPROVED'
          },
          { status: 400 }
        )
      }

      // 2. Machine-readable 409 error if mechanic is offline/unavailable at submission time
      if (targetMechProfile.is_available !== true) {
        return NextResponse.json(
          { 
            error: 'Selected mechanic is currently unavailable.', 
            code: 'PROVIDER_OFFLINE' 
          },
          { status: 409 }
        )
      }
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
        let targetMechanics = []

        // BRANCH A: Targeted dispatch to a preferred mechanic selected from map discovery
        if (preferredMechanicId) {
          const { data: preferredMech, error: mechErr } = await serviceSupabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', preferredMechanicId)
            .maybeSingle()

          if (!mechErr && preferredMech) {
            targetMechanics = [{
              user_id: preferredMech.id,
              full_name: preferredMech.full_name || 'Mechanic',
              email: preferredMech.email,
              distance_km: 'Direct',
            }]
          }
        }

        // BRANCH B: Standard geospatial broadcast matching (existing behavior unchanged)
        if (targetMechanics.length === 0) {
          const { data: nearbyMechanics, error: matchError } = await serviceSupabase.rpc('get_nearby_verified_mechanics', {
            lat: Number(incidentLat),
            lng: Number(incidentLng),
            radius_km: 10.0,
          })

          if (matchError) {
            console.error('[BACKGROUND MATCH ERROR]:', matchError.message)
            return
          }

          if (nearbyMechanics && nearbyMechanics.length > 0) {
            targetMechanics = nearbyMechanics
          }
        }

        if (targetMechanics.length > 0) {
          const notifications = targetMechanics.map((mechanic) => ({
            profile_id: mechanic.user_id,
            type: 'new_request',
            title: preferredMechanicId ? 'Direct rescue request' : 'New rescue request',
            body: preferredMechanicId 
              ? `Direct ${serviceType} request dispatched to you — ${body.incidentAddress || 'location pinned'}`
              : `New ${serviceType} request ${mechanic.distance_km}km away — ${body.incidentAddress || 'location pinned'}`,
          }))

          const { error: notifError } = await serviceSupabase
            .from('notifications')
            .insert(notifications)

          if (notifError) {
            console.error('[BACKGROUND NOTIFICATIONS INSERT ERROR]:', notifError.message)
          }

          // Send emails asynchronously
          targetMechanics.forEach((mechanic) => {
            sendNotificationEmail({
              to: mechanic.email || `mechanic-${mechanic.user_id}@roadrescue.com`,
              subject: preferredMechanicId
                ? `Direct ${serviceType} Request from Driver!`
                : `New ${serviceType} Request ${mechanic.distance_km}km away!`,
              type: 'new_request',
              data: {
                mechanicName: mechanic.full_name,
                issueDescription: body.problemDescription,
                location: body.incidentAddress || 'Location pinned',
                distance: typeof mechanic.distance_km === 'number' ? `${mechanic.distance_km} km` : `${mechanic.distance_km}`,
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
