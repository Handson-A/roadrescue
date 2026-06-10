// web/src/lib/admin.js
// All admin operations live here.
// Every function here uses serviceSupabase — never the regular client.
// Admin routes are the only place service role is used directly.

import { VERIFICATION_STATUS } from '@/lib/constants'

// ================================================
// MECHANIC VERIFICATION
// ================================================

// fetch all mechanics in a given verification state
// default is pending — the verification queue
export async function getMechanicsByStatus(serviceSupabase, status = 'pending') {
  const { data, error } = await serviceSupabase
    .from('mechanic_profiles')
    .select(`
      *,
      user:profiles!mechanic_profiles_user_id_fkey (
        id,
        full_name,
        phone,
        avatar_url,
        created_at
      )
    `)
    .eq('verification_status', status)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

// approve or reject a mechanic
// adminId is the admin performing the action — stored for audit trail
export async function updateMechanicVerification(
  serviceSupabase,
  mechanicUserId,
  newStatus,
  adminId
) {
  if (!Object.values(VERIFICATION_STATUS).includes(newStatus)) {
    throw new Error(`Invalid verification status: ${newStatus}`)
  }

  const { data, error } = await serviceSupabase
    .from('mechanic_profiles')
    .update({
      verification_status: newStatus,
      verified_at: new Date().toISOString(),
      verified_by: adminId,
    })
    .eq('user_id', mechanicUserId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ================================================
// OVERVIEW STATS
// ================================================

// single function that returns all dashboard numbers
// runs four parallel queries — faster than sequential
export async function getAdminStats(serviceSupabase) {
  const [
    { count: totalRequests },
    { count: activeRequests },
    { count: pendingVerifications },
    { count: availableMechanics },
    { count: totalUsers },
  ] = await Promise.all([
    // total requests ever
    serviceSupabase
      .from('rescue_requests')
      .select('*', { count: 'exact', head: true }),

    // requests currently in progress
    serviceSupabase
      .from('rescue_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'accepted', 'en_route', 'arrived', 'in_progress']),

    // mechanics waiting for verification
    serviceSupabase
      .from('mechanic_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending'),

    // mechanics currently available for dispatch
    serviceSupabase
      .from('mechanic_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified')
      .eq('is_available', true),

    // all users on the platform
    serviceSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
  ])

  return {
    totalRequests,
    activeRequests,
    pendingVerifications,
    availableMechanics,
    totalUsers,
  }
}

// ================================================
// ALL RESCUE REQUESTS (admin view)
// ================================================

export async function getAllRequests(serviceSupabase, { status, limit = 50, offset = 0 } = {}) {
  let query = serviceSupabase
    .from('rescue_requests')
    .select(`
      *,
      driver:profiles!rescue_requests_driver_id_fkey (
        id,
        full_name,
        phone
      ),
      mechanic:profiles!rescue_requests_mechanic_id_fkey (
        id,
        full_name,
        phone
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // optionally filter by status
  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// ================================================
// USER MANAGEMENT
// ================================================

export async function getAllUsers(serviceSupabase, { role, limit = 50, offset = 0 } = {}) {
  let query = serviceSupabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (role) {
    query = query.eq('role', role)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// suspend a user by deleting their auth account
// cascades to profiles via our FK constraint
// use carefully — this is irreversible from the admin dashboard
export async function suspendUser(serviceSupabase, userId) {
  const { error } = await serviceSupabase.auth.admin.deleteUser(userId)
  if (error) throw error
  return { success: true }
}