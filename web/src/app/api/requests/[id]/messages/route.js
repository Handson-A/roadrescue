import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = params?.id

    // Verify user is a participant
    const { data: rescueRequest, error: requestError } = await supabase
      .from('rescue_requests')
      .select('id, driver_id, mechanic_id')
      .eq('id', requestId)
      .single()

    if (requestError || !rescueRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const isParticipant = rescueRequest.driver_id === user.id || rescueRequest.mechanic_id === user.id
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, sender_id, sender_role, message, created_at')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    return NextResponse.json({ messages }, { status: 200 })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = params?.id
    const body = await request.json()
    const message = body.message?.trim()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Verify user is a participant and get their role
    const { data: rescueRequest, error: requestError } = await supabase
      .from('rescue_requests')
      .select('id, driver_id, mechanic_id')
      .eq('id', requestId)
      .single()

    if (requestError || !rescueRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    let senderRole = null
    if (rescueRequest.driver_id === user.id) {
      senderRole = 'driver'
    } else if (rescueRequest.mechanic_id === user.id) {
      senderRole = 'mechanic'
    }

    if (!senderRole) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Insert the message
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        request_id: requestId,
        sender_id: user.id,
        sender_role: senderRole,
        message,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}