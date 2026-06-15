import { createClient, createServiceClient } from '@/lib/supabase/server'

export const REQUEST_STATUS_FLOW = {
  pending: ['accepted', 'cancelled'],
  accepted: ['en_route', 'cancelled'],
  en_route: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export const NOTIFICATION_TYPES = {
  NEW_REQUEST: 'new_request',
  MECHANIC_ACCEPTED: 'mechanic_accepted',
  MECHANIC_EN_ROUTE: 'mechanic_en_route',
  MECHANIC_ARRIVED: 'mechanic_arrived',
  JOB_COMPLETED: 'job_completed',
  REQUEST_CANCELLED: 'request_cancelled',
  SYSTEM_ALERT: 'system_alert',
}

export function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeStatus(value) {
  return normalizeString(value).toLowerCase()
}

export function normalizeServiceType(value) {
  const normalized = normalizeStatus(value)
  return normalized || 'other'
}

export function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function buildGeoPoint(longitude, latitude) {
  return `SRID=4326;POINT(${longitude} ${latitude})`
}

export function normalizeDiagnosticResult(value) {
  if (!value) return null
  if (typeof value !== 'object') return null
  return {
    problem: Array.isArray(value.problems)
      ? value.problems[0]
      : value.problem || value.summary || '',
    severity: value.severity || 'low',
    recommendations: Array.isArray(value.recommendations) ? value.recommendations : [],
    estimated_causes: Array.isArray(value.estimated_causes)
      ? value.estimated_causes
      : Array.isArray(value.estimatedCauses)
        ? value.estimatedCauses
        : [],
  }
}

export function parseRequestPayload(payload = {}) {
  const latitude = toNumberOrNull(payload.latitude ?? payload.incidentLatitude)
  const longitude = toNumberOrNull(payload.longitude ?? payload.incidentLongitude)
  const vehicleDetails = normalizeString(
    payload.vehicleDetails ?? payload.vehicle_details ?? payload.vehicle_details_text
  )
  const issue = normalizeString(
    payload.issue ?? payload.issue_description ?? payload.problemDescription ?? payload.problem_description
  )
  const locationAddress = normalizeString(
    payload.locationAddress ?? payload.location_address ?? payload.location ?? payload.incident_address
  )
  const serviceType = normalizeServiceType(payload.serviceType ?? payload.service_type)

  return {
    latitude,
    longitude,
    vehicleDetails,
    issue,
    locationAddress,
    serviceType,
    diagnostics: normalizeDiagnosticResult(
      payload.diagnostics ?? payload.aiDiagnosticResult ?? payload.ai_diagnostic_result
    ),
  }
}

export function isValidTransition(currentStatus, nextStatus) {
  const current = normalizeStatus(currentStatus)
  const next = normalizeStatus(nextStatus)

  return REQUEST_STATUS_FLOW[current]?.includes(next) ?? false
}

export async function getRequestContext() {
  const userClient = await createClient()
  const serviceClient = await createServiceClient()
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Unauthorized',
      status: 401,
    }
  }

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: 'Profile not found',
      status: 404,
    }
  }

  return {
    user,
    profile,
    userClient,
    serviceClient,
  }
}

export async function insertNotifications(serviceClient, notifications) {
  if (!notifications.length) return []

  const { data, error } = await serviceClient
    .from('notifications')
    .insert(notifications)
    .select('*')

  if (error) throw error

  return data ?? []
}

export async function getNearbyMechanics(serviceClient, latitude, longitude, searchRadiusKm = 10) {
  const { data, error } = await serviceClient.rpc('get_nearby_verified_mechanics', {
    request_latitude: latitude,
    request_longitude: longitude,
    search_radius_km: searchRadiusKm,
  })

  if (error) throw error

  return data ?? []
}

export async function getRatingSummary(serviceClient, mechanicId) {
  const { data, error } = await serviceClient
    .from('rescue_requests')
    .select('driver_rating')
    .eq('mechanic_id', mechanicId)
    .eq('status', 'completed')

  if (error) throw error

  const completedRequests = data ?? []
  const ratedRequests = completedRequests.filter((request) => request.driver_rating !== null)
  const ratingTotal = ratedRequests.reduce((sum, request) => sum + Number(request.driver_rating), 0)

  return {
    totalJobs: completedRequests.length,
    ratingAvg: ratedRequests.length ? Number((ratingTotal / ratedRequests.length).toFixed(2)) : 0,
  }
}

export function formatRequestRow(request, extras = {}) {
  const vehicleDetails =
    request.vehicle_details ??
    extras.vehicleDetails ??
    [request.vehicle_year, request.vehicle_make, request.vehicle_model, request.vehicle_color, request.vehicle_plate]
      .filter(Boolean)
      .join(' ')
      .trim()

  return {
    ...request,
    vehicleDetails,
    issue: request.issue_description ?? request.problem_description ?? extras.issue ?? '',
    location: request.location_address ?? request.incident_address ?? extras.location ?? '',
    createdAt: request.created_at,
    updatedAt: request.updated_at,
    vehicle_image_url: request.vehicle_image_url ?? extras.vehicle_image_url ?? null,
    assignedMechanic: extras.assignedMechanic ?? null,
    bids: extras.bids ?? [],
    driver: extras.driver ?? null,
    serviceType: request.service_type,
  }
}
