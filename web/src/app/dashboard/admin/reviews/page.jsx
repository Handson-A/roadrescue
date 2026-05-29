'use client'

import { useEffect, useState } from 'react'

import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

export default function AdminReviewsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadRequests() {
      try {
        const response = await fetch('/api/admin/profile-change-requests?status=pending', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Failed to load review queue')
        if (mounted) setRequests(payload.requests || [])
      } catch (error) {
        toast.error(error.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadRequests()
    return () => {
      mounted = false
    }
  }, [])

  const review = async (requestId, action) => {
    setActionLoading(requestId)
    try {
      const response = await fetch('/api/admin/profile-change-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, reviewNotes: action === 'approved' ? 'Approved by admin review panel' : 'Rejected by admin review panel' }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to update request')
      toast.success(`Request ${action}`)
      await loadRequests()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <PageWrapper title="Pending edits review" description="Approve or reject driver and mechanic field changes before they take effect.">
      <div className="mx-auto max-w-5xl space-y-4">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : requests.length === 0 ? (
          <Card className="p-8 text-center text-sm text-[#7C7767]">No pending edits right now.</Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge label={request.status} variant={request.status} dot />
                    <Badge label={request.role} variant={request.role} />
                    <span className="text-xs text-[#7C7767]">{request.user?.full_name || request.user_id}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{request.target_table}.{request.field_key}</p>
                    <p className="mt-1 text-sm text-[#7C7767]">Reason: {request.reason || 'No reason provided'}</p>
                  </div>
                  <div className="grid gap-3 rounded-2xl bg-[#F3F4F6] p-4 text-sm lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7C7767]">Current</p>
                      <pre className="mt-2 whitespace-pre-wrap text-[#111827]">{JSON.stringify(request.old_value, null, 2) || '—'}</pre>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7C7767]">Requested</p>
                      <pre className="mt-2 whitespace-pre-wrap text-[#111827]">{JSON.stringify(request.new_value, null, 2)}</pre>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 lg:flex-col">
                  <Button loading={actionLoading === request.id} onClick={() => review(request.id, 'approved')} className="lg:w-36">Approve</Button>
                  <Button variant="outline" loading={actionLoading === request.id} onClick={() => review(request.id, 'rejected')} className="lg:w-36">Reject</Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </PageWrapper>
  )
}
