'use client'

import { useEffect, useState } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { timeAgo } from '@/lib/utils'
import Button from '@/components/ui/Button'

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadRequests() {
      if (mounted) setLoading(true)
      const url = filter === 'all'
        ? '/api/admin/requests'
        : `/api/admin/requests?status=${filter}`

      const response = await fetch(url, { cache: 'no-store' })
      const payload = await response.json()

      if (response.ok && mounted) {
        setRequests(payload.requests || [])
      }
      if (mounted) setLoading(false)
    }

    loadRequests()
    return () => {
      mounted = false
    }
  }, [filter])

  return (
    <PageWrapper title="All rescue requests" description="Monitor the full dispatch queue and filter by lifecycle status.">
      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === status ? 'bg-primary text-white shadow-soft' : 'bg-white text-muted hover:bg-surfaceAlt'}`}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="py-12 flex justify-center">
            <Spinner />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">No requests found for the selected status.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <Card key={request.id} className="hover:-translate-y-0.5 hover:shadow-lift transition">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={request.status} variant={request.status} dot />
                      <span className="text-xs text-muted">{timeAgo(request.created_at)}</span>
                    </div>
                    <p className="mt-3 text-lg font-semibold">{request.problem_description}</p>
                    <p className="mt-1 text-sm text-muted">{request.incident_address || 'Location pending'}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                      <span>Driver: {request.driver?.full_name || 'Unknown'}</span>
                      <span>Mechanic: {request.mechanic?.full_name || 'Unassigned'}</span>
                    </div>
                  </div>
                  <Button variant="outline">Open record</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </PageWrapper>
  )
}
