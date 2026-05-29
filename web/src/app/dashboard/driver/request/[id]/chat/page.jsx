'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import RescueChatPanel from '@/components/request/RescueChatPanel'

export default function DriverRescueChatPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const initialMessages = [
    {
      id: 1,
      sender: 'them',
      text: 'Hello, I am on the way and I have your request open. Keep your hazards on and share your exact roadside position.',
      time: '14:02',
    },
    {
      id: 2,
      sender: 'me',
      text: 'I am parked safely on the shoulder near the exit. I will keep the location pinned.',
      time: '14:03',
    },
  ]

  return (
    <RescueChatPanel
      title="Active Rescue Chat"
      subtitle="Coordinate directly with the assigned mechanic while the rescue is in progress."
      contactName={profile?.full_name || 'Assigned mechanic'}
      contactRole="RoadRescue responder"
      statusText={`Request #${id} · ETA active`}
      statusTone="warning"
      initialMessages={initialMessages}
      primaryActionHref={`/dashboard/driver/request/${id}/rating`}
      primaryActionLabel="Rate after rescue"
      secondaryActionHref={`/dashboard/driver/request/${id}`}
      secondaryActionLabel="Live tracking"
    />
  )
}