'use client'

import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MechanicRequestsPage() {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('rescue_requests').select('id, status, service_type, incident_address, created_at').order('created_at', { ascending: false }).limit(20)
      if (mounted) setRequests(data || [])
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <PageWrapper title="Requests" description="Incoming requests and matches for nearby mechanics.">
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[#111827]">Open Requests</h2>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </Card>

        <div className="space-y-3">
          {requests.length === 0 ? (
            <Card className="p-8 text-center text-sm text-[#7C7767]">No open requests nearby.</Card>
          ) : (
            requests.map(r => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{r.service_type}</p>
                    <p className="text-xs text-[#7C7767]">{r.incident_address || 'Location pending'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#7C7767]">{r.status}</p>
                    <p className="text-xs text-[#7C7767]">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
