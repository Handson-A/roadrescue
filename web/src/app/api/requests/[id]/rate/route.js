// import {
//   getRatingSummary,
//   getRequestContext,
//   normalizeString,
// } from '@/lib/rescueLifecycle'

// export async function POST(request, { params }) {
//   try {
//     const context = await getRequestContext()
//     if (context.error) {
//       return Response.json({ error: context.error }, { status: context.status })
//     }

//     const { user, profile, serviceClient } = context
//     const requestId = params?.id
//     const body = await request.json().catch(() => ({}))
//     const rating = Number(body.rating ?? body.driverRating)
//     const review = normalizeString(body.review ?? body.driverReview)

//     if (profile.role !== 'driver' && profile.role !== 'admin') {
//       return Response.json({ error: 'Only drivers can rate completed jobs' }, { status: 403 })
//     }

//     if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
//       return Response.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
//     }

//     const { data: rescueRequest, error: requestError } = await serviceClient
//       .from('rescue_requests')
//       .select('id, driver_id, mechanic_id, status')
//       .eq('id', requestId)
//       .maybeSingle()

//     if (requestError) throw requestError
//     if (!rescueRequest) {
//       return Response.json({ error: 'Request not found' }, { status: 404 })
//     }

//     if (rescueRequest.driver_id !== user.id && profile.role !== 'admin') {
//       return Response.json({ error: 'Not authorized to rate this request' }, { status: 403 })
//     }

//     if (rescueRequest.status !== 'completed') {
//       return Response.json({ error: 'You can only rate completed requests' }, { status: 409 })
//     }

//     if (!rescueRequest.mechanic_id) {
//       return Response.json({ error: 'Completed request has no assigned mechanic' }, { status: 409 })
//     }

//     const { error: updateError } = await serviceClient
//       .from('rescue_requests')
//       .update({
//         driver_rating: rating,
//         driver_review: review || null,
//       })
//       .eq('id', requestId)

//     if (updateError) throw updateError

//     const summary = await getRatingSummary(serviceClient, rescueRequest.mechanic_id)

//     const { error: mechanicProfileError } = await serviceClient
//       .from('mechanic_profiles')
//       .update({
//         rating_avg: summary.ratingAvg,
//         total_jobs: summary.totalJobs,
//       })
//       .eq('user_id', rescueRequest.mechanic_id)

//     if (mechanicProfileError) throw mechanicProfileError

//     return Response.json(
//       {
//         message: 'Rating saved successfully',
//         rating,
//         review: review || null,
//         mechanic: {
//           id: rescueRequest.mechanic_id,
//           ratingAvg: summary.ratingAvg,
//           totalJobs: summary.totalJobs,
//         },
//       },
//       { status: 200 }
//     )
//   } catch (error) {
//     console.error('Rating update error:', error)
//     return Response.json({ error: 'Failed to save rating' }, { status: 500 })
//   }
// }

// web/src/app/api/requests/rate/route.js

import { createClient } from '@/lib/supabase/server'
import { submitRating } from '@/lib/request'
import { NextResponse } from 'next/server'

export async function PATCH(req) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { requestId, rating, review } = body

    if (!requestId || !rating) {
      return NextResponse.json(
        { error: 'requestId and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const result = await submitRating(supabase, {
      requestId,
      driverId: user.id,
      rating,
      review,
    })

    return NextResponse.json(result, { status: 200 })

  } catch (err) {
    console.error('[PATCH /api/requests/rate]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}