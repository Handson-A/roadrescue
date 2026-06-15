import { VERIFICATION_STATUS } from '@/lib/constants'

// ================================================
// MECHANIC VERIFICATION
// ================================================

// Fetch all mechanics matching a given verification state
export async function getMechanicsByStatus(serviceSupabase, status = 'pending') {
  // Query status via relational link table mapping
  const { data, error } = await serviceSupabase
    .from('mechanic_verifications')
    .select(`
      id,
      status,
      created_at,
      mechanic:mechanic_profiles!inner (
        user_id,
        business_name,
        years_experience,
        location_label,
        profile:profiles (
          id,
          full_name,
          phone,
          avatar_url
        )
      )
    `)
    .eq('status', status)
    .order('created_at', { ascending: true })

  if (error) throw error
  
  // Format flat shape mapping to stay backwards-compatible with your frontend layout views
  return data.map(item => ({
    user_id: item.mechanic?.user_id,
    business_name: item.mechanic?.business_name,
    years_experience: item.mechanic?.years_experience,
    location_label: item.mechanic?.location_label,
    verification_status: item.status,
    created_at: item.created_at,
    user: item.mechanic?.profile
  }))
}

// Approve or reject a mechanic verification log row
export async function updateMechanicVerification(
  serviceSupabase,
  mechanicUserId,
  newStatus,
  adminId
) {
  const { data, error } = await serviceSupabase
    .from('mechanic_verifications')
    .update({
      status: newStatus,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('mechanic_id', mechanicUserId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ================================================
// COMPREHENSIVE OVERVIEW STATS
// ================================================
export async function getAdminStats(serviceSupabase) {
  // 1. Fetch Rescue Metrics counters concurrently
  const [
    { count: totalRequests }, 
    { count: activeRequests }, 
    { count: completedRequests }, 
    { count: cancelledRequests }
  ] = await Promise.all([
    serviceSupabase.from('rescue_requests').select('*', { count: 'exact', head: true }),
    serviceSupabase.from('rescue_requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'accepted', 'en_route', 'arrived', 'in_progress']),
    serviceSupabase.from('rescue_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    serviceSupabase.from('rescue_requests').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
  ])

  // 2. Fetch Response & Latency Metrics data sets safely
  const { data: acceptedRequests } = await serviceSupabase
    .from('rescue_requests')
    .select('created_at, accepted_at')
    .not('accepted_at', 'is', null)
    .limit(1000)

  const { data: completedJobs } = await serviceSupabase
    .from('rescue_requests')
    .select('accepted_at, completed_at')
    .eq('status', 'completed')
    .not('accepted_at', 'is', null)
    .not('completed_at', 'is', null)
    .limit(1000)

  const avgResponseTime = acceptedRequests && acceptedRequests.length > 0
    ? acceptedRequests.reduce((sum, r) => sum + (new Date(r.accepted_at) - new Date(r.created_at)), 0) / acceptedRequests.length / 60000
    : 0

  const avgCompletionTime = completedJobs && completedJobs.length > 0
    ? completedJobs.reduce((sum, r) => sum + (new Date(r.completed_at) - new Date(r.accepted_at)), 0) / completedJobs.length / 60000
    : 0

  // 3. Fetch Mechanic Metrics via verified mapping schemas
  const [
    { count: verifiedMechanics }, 
    { count: totalMechanics }, 
    { count: activeMechanics },
    { count: pendingVerifications }
  ] = await Promise.all([
    serviceSupabase.from('mechanic_verifications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    serviceSupabase.from('mechanic_profiles').select('*', { count: 'exact', head: true }),
    serviceSupabase.from('mechanic_profiles').select('*', { count: 'exact', head: true }).eq('is_available', true),
    serviceSupabase.from('mechanic_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  // 4. Fetch Top Performing Mechanics ordered by rating metrics
  const { data: topMechanics } = await serviceSupabase
    .from('mechanic_profiles')
    .select('user_id, business_name, rating_avg, rating_count, profiles(full_name, avatar_url)')
    .order('rating_avg', { ascending: false })
    .limit(5)

    // Mechanic Metrics: Fetch is_available mechanics along with their live coordinates
  const { data: activeMechanicLocations } = await serviceSupabase
    .from('mechanic_profiles')
    .select(`
      user_id,
      business_name,
      is_available,
      current_location,
      profiles (
        full_name,
        phone,
        avatar_url
      )
    `)
    .eq('is_available', true)
    .not('current_location', 'is', null)
    
  // 5. Fetch Total Drivers counter metrics
  const { count: totalDrivers } = await serviceSupabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'driver')

  // 6. Fetch Satisfaction Metrics from designated request_reviews table
  const { data: reviews } = await serviceSupabase
    .from('request_reviews')
    .select('rating')

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 5.0 // Fallback brand default anchor point

  const ratingsDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  if (reviews) {
    reviews.forEach((r) => {
      const ratingVal = Math.round(r.rating)
      if (ratingsDistribution[ratingVal] !== undefined) ratingsDistribution[ratingVal]++
    })
  }

  // 7. Dynamic aggregations mapping incident breakdowns
  const { data: allRequestsForAggregation } = await serviceSupabase
    .from('rescue_requests')
    .select('service_type, status')

  const serviceTypeCounts = {}
  const statusCounts = {}

  if (allRequestsForAggregation) {
    allRequestsForAggregation.forEach((r) => {
      serviceTypeCounts[r.service_type] = (serviceTypeCounts[r.service_type] || 0) + 1
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
    })
  }

  const serviceTypeBreakdown = Object.entries(serviceTypeCounts).map(([service_type, count]) => ({ service_type, count }))
  const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  return {
    totalRequests: totalRequests || 0,
    activeRequests: activeRequests || 0,
    completedRequests: completedRequests || 0,
    cancelledRequests: cancelledRequests || 0,
    avgResponseTime: Number(avgResponseTime.toFixed(1)),
    avgCompletionTime: Number(avgCompletionTime.toFixed(1)),
    verifiedMechanics: verifiedMechanics || 0,
    activeMechanics: activeMechanics || 0,
    topMechanics: topMechanics || [],
    totalDrivers: totalDrivers || 0,
    avgRating: Number(avgRating.toFixed(2)),
    ratingsDistribution,
    serviceTypeBreakdown,
    statusBreakdown,
    totalUsers: (totalMechanics || 0) + (totalDrivers || 0),
    pendingVerifications: pendingVerifications || 0,
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
      driver:profiles!rescue_requests_driver_id_fkey (id, full_name, phone),
      mechanic:profiles!rescue_requests_mechanic_id_fkey (id, full_name, phone)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

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

export async function suspendUser(serviceSupabase, userId) {
  const { error } = await serviceSupabase.auth.admin.deleteUser(userId)
  if (error) throw error
  return { success: true }
}