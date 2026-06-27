import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/rbac'
import { sanitizeInput } from '@/lib/validate'

export async function GET() {
  const result = await requireAdmin()
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
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
    .order('created_at', { ascending: false })
    .limit(200)

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

    const { data, error } = await supabase
      .from('issue_reports')
      .insert({
        request_id: requestId,
        reporter_id: user.id,
        reason_header: reasonHeader,
        comment: comment.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('[REPORTS INSERT]:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create report.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ report: data }, { status: 201 })
  } catch (err) {
    console.error('[REPORTS ROUTE]:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
