// web/src/app/api/admin/mechanics/route.js
// GET  → fetch mechanics by verification status
// PATCH → approve or reject a mechanic

import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  getMechanicsByStatus,
  updateMechanicVerification,
} from '@/lib/admin'
import { NOTIFICATION_TYPE } from '@/lib/constants'
import { NextResponse } from 'next/server'

// reusable admin auth check
// returns { user, profile } if admin, throws if not
async function requireAdmin(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Forbidden')

  return { user, profile }
}

export async function GET(req) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    await requireAdmin(supabase)

    // read ?status=pending from query params — defaults to pending
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    const mechanics = await getMechanicsByStatus(serviceSupabase, status)

    return NextResponse.json({ mechanics }, { status: 200 })

  } catch (err) {
    const status = err.message === 'Unauthorized' ? 401
      : err.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}

export async function PATCH(req) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    const { user } = await requireAdmin(supabase)

    const body = await req.json()
    const { mechanicUserId, newStatus } = body

    if (!mechanicUserId || !newStatus) {
      return NextResponse.json(
        { error: 'mechanicUserId and newStatus are required' },
        { status: 400 }
      )
    }

    const updated = await updateMechanicVerification(
      serviceSupabase,
      mechanicUserId,
      newStatus,
      user.id   // adminId for audit trail
    )

    if (newStatus === 'verified') {
      const { error: notificationError } = await serviceSupabase
        .from('notifications')
        .insert({
          user_id: mechanicUserId,
          type: NOTIFICATION_TYPE.SYSTEM_ALERT,
          message:
            'Your RoadRescue professional profile has been verified. You can now toggle your status to Active to receive live emergency requests.',
          is_read: false,
        })

      if (notificationError) {
        console.warn('Failed to create mechanic approval notification:', notificationError)
      }
    }

    return NextResponse.json({ mechanic: updated }, { status: 200 })

  } catch (err) {
    const status = err.message === 'Unauthorized' ? 401
      : err.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}