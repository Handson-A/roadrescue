// src/app/api/admin/mechanics/route.js
// GET  → fetch mechanics by verification status
// PATCH → approve or reject a mechanic

import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  getMechanicsByStatus,
  updateMechanicVerification,
} from '@/lib/admin'
import { NOTIFICATION_TYPE } from '@/lib/constants'
import { NextResponse } from 'next/server'

/**
 * Reusable admin auth verification sentinel layer
 * Ensures the requesting session belongs strictly to a verified system administrator
 */
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

    // Read ?status=pending from query parameters — defaults to pending queue arrays
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

    // Standardize input mappings parameters
    const statusMap = { verified: 'approved', approve: 'approved' }
    const dbStatus = statusMap[newStatus] || newStatus

    if (!mechanicUserId || !newStatus) {
      return NextResponse.json(
        { error: 'mechanicUserId and newStatus are required' },
        { status: 400 }
      )
    }

    // 1. Commit review parameters log straight to the mechanic_verifications ledger
    const updated = await updateMechanicVerification(
      serviceSupabase,
      mechanicUserId,
      newStatus,
      user.id   // adminId tracking parameter for database logs audit trail
    )

    // 2. FIXED: Map verification state boolean flags straight to the true matching schema field column
    const isApproved = dbStatus === 'approved'
    const { error: profileLinkError } = await serviceSupabase
      .from('mechanic_profiles')
      .update({ is_verified: isApproved })
      .eq('user_id', mechanicUserId)

    if (profileLinkError) {
      console.error('[SCHEMA CRASH] Failed to sync verification flag parameters to mechanic_profiles:', profileLinkError.message)
    }

    // ========================================================================
    // DYNAMIC NOTIFICATION & ACCOUNT MANAGEMENT WORKFLOW LOOPS
    // ========================================================================
    if (dbStatus === 'approved') {
      const { error: notificationError } = await serviceSupabase
        .from('notifications')
        .insert({
          profile_id: mechanicUserId,
          type: NOTIFICATION_TYPE.VERIFICATION,
          title: 'Profile verified',
          body: 'Your RoadRescue professional profile has been verified. You can now toggle your status to Active to receive live emergency requests.',
          is_read: false,
        })

      if (notificationError) {
        console.warn('Failed to create mechanic approval notification:', notificationError.message)
      }
    }

    if (newStatus === 'rejected') {
      // Fetch mechanic registration email profile securely using service role permissions bypass
      const { data: mechanicProfile, error: emailErr } = await serviceSupabase
        .from('profiles')
        .select('email')
        .eq('id', mechanicUserId)
        .maybeSingle()

      if (emailErr) {
        console.warn('Failed to fetch rejected mechanic email records payload:', emailErr)
      }

      if (mechanicProfile?.email) {
        // Enforce account firewall blacklist blocks
        const { error: blockErr } = await serviceSupabase
          .from('blocked_emails')
          .insert({
            email: mechanicProfile.email,
            reason: 'Mechanic profile rejected by admin operations control board',
          })

        if (blockErr && !String(blockErr.message || '').toLowerCase().includes('duplicate')) {
          console.warn('Failed to add email parameter address to system block list:', blockErr)
        }

        // Drop auth credentials immediately to destroy active sessions
        try {
          await serviceSupabase.auth.admin.deleteUser(mechanicUserId)
        } catch (deleteErr) {
          console.warn('Failed to delete rejected auth user framework node (non-fatal):', deleteErr)
        }
      }

      const { error: notificationError } = await serviceSupabase
        .from('notifications')
        .insert({
          profile_id: mechanicUserId,
          type: NOTIFICATION_TYPE.VERIFICATION,
          title: 'Profile registration rejected',
          body: 'Your profile verification was rejected. Your account has been disabled. You cannot create a new account with this email.',
          is_read: false,
        })

      if (notificationError) {
        console.warn('Failed to commit rejection verification notification row:', notificationError)
      }
    }

    if (newStatus === 'more_info') {
      const { error: notificationError } = await serviceSupabase
        .from('notifications')
        .insert({
          profile_id: mechanicUserId,
          type: NOTIFICATION_TYPE.VERIFICATION,
          title: 'Additional information required',
          body: 'Please provide additional documentation or information for your verification to proceed.',
          is_read: false,
        })

      if (notificationError) {
        console.warn('Failed to create descriptive info feedback notification log:', notificationError)
      }
    }

    return NextResponse.json({ mechanic: updated }, { status: 200 })

  } catch (err) {
    const status = err.message === 'Unauthorized' ? 401
      : err.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}