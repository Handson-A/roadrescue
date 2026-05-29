// web/src/app/api/admin/users/route.js
// GET  → all users with optional role filter
// DELETE → suspend a user account

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAllUsers, suspendUser } from '@/lib/admin'
import { NextResponse } from 'next/server'

async function requireAdmin(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return { user }
}

export async function GET(req) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    await requireAdmin(supabase)

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') || null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const users = await getAllUsers(serviceSupabase, { role, limit, offset })

    return NextResponse.json({ users }, { status: 200 })

  } catch (err) {
    const status = err.message === 'Unauthorized' ? 401
      : err.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}

export async function DELETE(req) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    await requireAdmin(supabase)

    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    await suspendUser(serviceSupabase, userId)

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err) {
    const status = err.message === 'Unauthorized' ? 401
      : err.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}