'use client'

import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import RescueChatPanel from '@/components/request/RescueChatPanel'

export default function MechanicJobChatPage() {
  const { id } = useParams()
  const { profile } = useAuth()

  return (
    <RescueChatPanel
      title="Rescue Coordination"
      subtitle="Keep the driver updated while you are en route or on site."
      contactName={profile?.full_name || 'Driver'}
      contactRole="Stranded driver"
      statusText={`Job #${id} · live thread`}
      statusTone="success"
      initialMessages={[
        { id: 1, sender: 'them', text: 'I am on the shoulder with hazards on. The vehicle is safe to approach.', time: '14:02' },
        { id: 2, sender: 'me', text: 'Understood. I am 4 minutes away and will pull in behind you.', time: '14:05' },
      ]}
      primaryActionHref={`/dashboard/mechanic/job/${id}/complete`}
      primaryActionLabel="Complete job"
      secondaryActionHref={`/dashboard/mechanic/job/${id}`}
      secondaryActionLabel="Job details"
    />
  )
}