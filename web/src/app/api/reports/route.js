import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/rbac'
import { sanitizeInput } from '@/lib/validate'
import { insertNotifications } from '@/lib/rescueLifecycle'

export async function GET() {
  const result = await requireAdmin()
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const supabase = await createClient()

  let query = supabase
    .from('issue_reports')
    .select(`
      id,
      request_id,
      reporter_id,
      reason_header,
      comment,
      created_at,
      reporter:profiles!issue_reports_reporter_id_fkey (full_name, role),
      request:request_id (id, service_type, problem_description, incident_address, status)
    `)

  let { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(200)

  if (error && error.message.includes('reason_header')) {
    const fallbackQuery = supabase
      .from('issue_reports')
      .select(`
        id,
        request_id,
        reporter_id,
        reason,
        comment,
        created_at,
        reporter:profiles!issue_reports_reporter_id_fkey (full_name, role),
        request:request_id (id, service_type, problem_description, incident_address, status)
      `)
    const fbRes = await fallbackQuery
      .order('created_at', { ascending: false })
      .limit(200)
    data = fbRes.data?.map(item => ({ ...item, reason_header: item.reason }))
    error = fbRes.error
  }

  if (error) {
    console.error('[REPORTS FETCH]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reports: data })
}

export async function POST(request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const rawBody = await request.json()
    const body = sanitizeInput(rawBody)
    const { requestId, reporterId, reasonHeader, comment } = body

    if (!requestId || !reasonHeader || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId, reasonHeader, and comment are required.' },
        { status: 400 }
      )
    }

    if (!['inappropriate_behavior', 'pricing_issue', 'delay', 'other'].includes(reasonHeader)) {
      return NextResponse.json({ error: 'Invalid reason header.' }, { status: 400 })
    }

    if (reporterId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: reporter ID mismatch.' }, { status: 403 })
    }

    const insertPayload = {
      request_id: requestId,
      reporter_id: user.id,
      comment: comment.trim(),
    }

    let { data, error } = await supabase
      .from('issue_reports')
      .insert({
        ...insertPayload,
        reason_header: reasonHeader,
      })
      .select()
      .single()

    if (error && error.message.includes('reason_header')) {
      const fbRes = await supabase
        .from('issue_reports')
        .insert({
          ...insertPayload,
          reason: reasonHeader,
        })
        .select()
        .single()
      data = fbRes.data ? { ...fbRes.data, reason_header: fbRes.data.reason } : null
      error = fbRes.error
    }

    if (error) {
      console.error('[REPORTS INSERT]:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create report.' },
        { status: 500 }
      )
    }

    // Fetch all admin profiles and notify them of the report
    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        const adminNotifs = admins.map(adm => ({
          profile_id: adm.id,
          type: 'system',
          title: 'New Incident Report',
          body: `A new incident report was filed for request #${requestId.slice(0, 8)}. Reason: ${reasonHeader}.`,
          request_id: requestId,
          is_read: false,
        }))
        const serviceSupabase = await createServiceClient()
        await insertNotifications(serviceSupabase, adminNotifs)
      }
    } catch (e) {
      console.warn('Failed to notify admins of incident report:', e)
    }

    return NextResponse.json({ report: data }, { status: 201 })
  } catch (err) {
    console.error('[REPORTS ROUTE]:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
