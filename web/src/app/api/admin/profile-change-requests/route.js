import { NextResponse } from 'next/server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireAdmin, createErrorResponse } from '@/lib/rbac'

const driverFieldMap = {
  full_name: { table: 'profiles', column: 'full_name' },
  phone: { table: 'profiles', column: 'phone' },
  vehicle_make: { table: 'driver_profiles', column: 'vehicle_make' },
  vehicle_model: { table: 'driver_profiles', column: 'vehicle_model' },
  vehicle_year: { table: 'driver_profiles', column: 'vehicle_year' },
  vehicle_color: { table: 'driver_profiles', column: 'vehicle_color' },
  vehicle_plate: { table: 'driver_profiles', column: 'vehicle_plate' },
  emergency_contact_name: { table: 'driver_profiles', column: 'emergency_contact_name' },
  emergency_contact_phone: { table: 'driver_profiles', column: 'emergency_contact_phone' },
  home_area: { table: 'driver_profiles', column: 'home_area' },
}

const mechanicFieldMap = {
  phone: { table: 'profiles', column: 'phone' },
  business_name: { table: 'mechanic_profiles', column: 'business_name' },
  specializations: { table: 'mechanic_profiles', column: 'specializations' },
  years_experience: { table: 'mechanic_profiles', column: 'years_experience' },
  license_number: { table: 'mechanic_profiles', column: 'license_number' },
  license_expiry: { table: 'mechanic_profiles', column: 'license_expiry' },
  service_radius_km: { table: 'mechanic_profiles', column: 'service_radius_km' },
  location_label: { table: 'mechanic_profiles', column: 'location_label' },
}

function mapField(targetTable, fieldKey) {
  if (targetTable === 'driver_profiles' || targetTable === 'profiles') return driverFieldMap[fieldKey] || null
  if (targetTable === 'mechanic_profiles') return mechanicFieldMap[fieldKey] || null
  return null
}

export async function GET(req) {
  try {
    const access = await requireAdmin()
    if (access.error) return createErrorResponse(access.error, access.status)

    const serviceSupabase = await createServiceClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    const { data, error } = await serviceSupabase
      .from('profile_change_requests')
      .select(`
        *,
        user:profiles!profile_change_requests_user_id_fkey (id, full_name, phone, role),
        reviewer:profiles!profile_change_requests_reviewed_by_fkey (id, full_name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ requests: data || [] }, { status: 200 })
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}

export async function PATCH(req) {
  try {
    const access = await requireAdmin()
    if (access.error) return createErrorResponse(access.error, access.status)

    const { profile } = access
    const serviceSupabase = await createServiceClient()
    const body = await req.json()
    const { requestId, action, reviewNotes } = body

    if (!requestId || !action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'requestId and valid action are required' }, { status: 400 })
    }

    const { data: request, error: requestError } = await serviceSupabase
      .from('profile_change_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError) throw requestError

    if (action === 'approved') {
      const mapping = mapField(request.target_table, request.field_key)
      if (!mapping) {
        return NextResponse.json({ error: 'Unsupported field for approval workflow' }, { status: 400 })
      }

      const updateValue = request.new_value && typeof request.new_value === 'object' && !Array.isArray(request.new_value)
        ? request.new_value
        : { [mapping.column]: request.new_value }

      const { error: updateError } = await serviceSupabase
        .from(mapping.table)
        .update(updateValue)
        .eq(mapping.table === 'profiles' ? 'id' : 'user_id', request.user_id)

      if (updateError) throw updateError
    }

    const { data, error } = await serviceSupabase
      .from('profile_change_requests')
      .update({
        status: action,
        review_notes: reviewNotes || null,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ request: data }, { status: 200 })
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}