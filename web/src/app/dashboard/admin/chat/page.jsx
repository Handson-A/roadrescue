'use client'

import RescueChatPanel from '@/components/request/RescueChatPanel'

export default function AdminChatPage() {
  return (
    <RescueChatPanel
      title="Platform Coordination Chat"
      subtitle="Coordinate with drivers and mechanics during active incidents."
      contactName="Dispatch Console"
      contactRole="Control center"
      statusText="Live platform thread"
      statusTone="warning"
      initialMessages={[
        { id: 1, sender: 'them', text: 'Incident #8821 has been escalated and a mechanic is en route.', time: '14:01' },
        { id: 2, sender: 'me', text: 'Copy. Continue monitoring and keep the driver updated.', time: '14:03' },
      ]}
      primaryActionLabel="Open requests"
      primaryActionHref="/dashboard/admin/requests"
      secondaryActionLabel="View notifications"
      secondaryActionHref="/dashboard/admin/notifications"
    />
  )
}