import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

async function requireUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return user
}

export async function GET() {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)

    const { data, error } = await supabase
      .from('profile_change_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ requests: data || [] }, { status: 200 })
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}

export async function POST(req) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    const body = await req.json()

    const { role, target_table, field_key, old_value, new_value, reason } = body

    if (!role || !target_table || !field_key || typeof new_value === 'undefined') {
      return NextResponse.json({ error: 'role, target_table, field_key, and new_value are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('profile_change_requests')
      .insert({
        user_id: user.id,
        role,
        target_table,
        field_key,
        old_value: old_value ?? null,
        new_value,
        reason: reason || null,
      })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ request: data }, { status: 201 })
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}