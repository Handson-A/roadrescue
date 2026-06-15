import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAllUsers, suspendUser } from '@/lib/admin'
import { NextResponse } from 'next/server'

// Shared Internal Security Clearance Guard
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

// ================================================
// GET PORTAL: FETCH SYSTEM IDENTITIES FRAMEWORK
// ================================================
export async function GET(req) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    // Enforce strict administrative clearance checking
    await requireAdmin(supabase)

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') || null
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query explicitly through the service client to bypass driver/mechanic profile RLS blocks
    let query = serviceSupabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply strict filtering parameters
    if (role) {
      // If a single target role classification is selected, match it exactly
      query = query.eq('role', role)
    } else {
      // CRITICAL GUARD: Filter out all global admin entries to keep this dashboard view clean
      query = query.neq('role', 'admin')
    }

    const { data: users, error: dbError } = await query
    if (dbError) throw dbError

    return NextResponse.json({ users: users || [] }, { status: 200 })

  } catch (err) {
    console.error('[SERVER ROUTE FAULT] GET /api/admin/users failed:', err)
    
    const status = err.message === 'Unauthorized' ? 401
      : err.message === 'Forbidden' ? 403 : 500
      
    return NextResponse.json({ error: err.message || 'Internal server error processing identity records' }, { status })
  }
}

// ================================================
// DELETE PORTAL: SUSPEND & ERASE ACCESS PRIVILEGES
// ================================================
export async function DELETE(req) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    await requireAdmin(supabase)

    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter reference is required' }, { status: 400 })
    }

    // Call service-role method to drop the auth record (cascades to core profiles automatically)
    await suspendUser(serviceSupabase, userId)

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err) {
    console.error('[SERVER ROUTE FAULT] DELETE /api/admin/users account erasure blocked:', err)
    
    const status = err.message === 'Unauthorized' ? 401
      : err.message === 'Forbidden' ? 403 : 500
      
    return NextResponse.json({ error: err.message || 'Identity drop transaction failed' }, { status })
  }
}