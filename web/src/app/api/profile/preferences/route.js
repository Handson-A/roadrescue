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
      .from('profile_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ preferences: data || null }, { status: 200 })
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}

export async function PUT(req) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    const body = await req.json()

    const payload = {
      user_id: user.id,
      theme: body.theme || 'system',
      preferred_language: body.preferred_language || 'en',
      notification_preferences: body.notification_preferences || {},
      communication_preferences: body.communication_preferences || [],
      home_location_label: body.home_location_label || null,
      work_location_label: body.work_location_label || null,
      bio: body.bio || null,
      secondary_phone: body.secondary_phone || null,
    }

    const { data, error } = await supabase
      .from('profile_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ preferences: data }, { status: 200 })
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
}