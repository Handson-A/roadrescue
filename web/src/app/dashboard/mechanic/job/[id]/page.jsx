'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import RequestTimeline from '@/components/request/RequestTimeline'
import Button from '@/components/ui/Button'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function JobDetailPage() {
  const params = useParams()
  const jobId = params.id
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadJob() {
      const response = await fetch(`/api/requests/${jobId}`)
      const { request } = await response.json()
      if (response.ok) setJob(request)
      setLoading(false)
    }

    loadJob()
  }, [jobId])

  useEffect(() => {
    if (!jobId) return

    const channel = supabase
      .channel(`request-status-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rescue_requests',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          setJob(prev => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [jobId, supabase])

  if (loading) return <PageWrapper title="Job details"><div className="flex h-[50vh] items-center justify-center"><Spinner /></div></PageWrapper>
  if (!job) return <PageWrapper title="Job details"><Card><div className="py-12 text-center text-sm text-muted">Job not found.</div></Card></PageWrapper>

  const updateStatus = async (newStatus) => {
    setUpdating(true)
    const response = await fetch('/api/requests/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: jobId, newStatus }),
    })

    const result = await response.json()
    if (response.ok && result.request) {
      setJob(result.request)
    } else {
      alert(result.error || 'Unable to update job status')
    }
    setUpdating(false)
  }

  const cancelJob = async () => {
    if (!confirm('Cancel this rescue request?')) return
    setUpdating(true)
    const response = await fetch('/api/requests/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: jobId, newStatus: 'cancelled' }),
    })

    const result = await response.json()
    if (response.ok && result.request) {
      setJob(result.request)
    } else {
      alert(result.error || 'Unable to cancel job')
    }
    setUpdating(false)
  }

  const acceptJob = async () => {
    setUpdating(true)
    const response = await fetch('/api/requests/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: jobId, newStatus: 'accepted' }),
    })

    const result = await response.json()
    if (response.ok && result.request) {
      setJob(result.request)
    } else {
      alert(result.error || 'Unable to accept job')
    }
    setUpdating(false)
  }

  return (
    <PageWrapper title={`Job #${jobId.slice(0, 8)}`} description="Move this rescue request through each stage and keep the driver updated.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {job.status === 'pending' && !job.mechanic_id && (
            <Card className="rounded-2xl border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 text-center">
              <h2 className="text-lg font-black text-amber-900 mb-2">Ready to Accept?</h2>
              <p className="text-sm text-amber-700 mb-4">Be the first to accept this rescue request. Race conditions are handled automatically.</p>
              <Button onClick={acceptJob} disabled={updating} className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-wider">
                {updating ? 'Accepting...' : 'Accept This Job'}
              </Button>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">Job status</h2>
              <Badge label={job.status} variant={job.status} dot />
            </div>
            <RequestTimeline currentStatus={job.status} />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">Problem details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Service type</p>
                <p className="text-sm font-medium">{job.service_type}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Description</p>
                <p className="text-sm">{job.problem_description}</p>
              </div>
              {job.ai_diagnostic_result && (
                <div className="mt-4 rounded-2xl border border-info/20 bg-info/5 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-info">AI diagnosis</p>
                  <p className="text-sm text-info">{job.ai_diagnostic_result.problem || job.ai_diagnostic_result.summary || 'AI analysis pending'}</p>
                  {job.ai_diagnostic_result.severity && (
                    <p className="mt-2 text-xs">Severity: <span className="font-semibold">{job.ai_diagnostic_result.severity}</span></p>
                  )}
                  {job.ai_diagnostic_result.recommendations?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold">Recommendations:</p>
                      <ul className="list-disc list-inside text-xs mt-1">
                        {job.ai_diagnostic_result.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">Vehicle</h2>
            <p className="text-sm">{job.vehicle_year} {job.vehicle_make} {job.vehicle_model}</p>
            <p className="mt-2 text-xs text-muted">{job.vehicle_plate}</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Driver</h2>
            <div className="flex items-center gap-3 mb-4">
              {job.driver?.avatar_url && (
                <Image src={job.driver.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full" unoptimized />
              )}
              <div>
                <p className="font-medium text-sm">{job.driver?.full_name}</p>
                <p className="text-xs text-muted">{job.driver?.phone}</p>
              </div>
            </div>
            <a href={`tel:${job.driver?.phone}`} className="block">
              <Button className="w-full">Call driver</Button>
            </a>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">Location</h2>
            <p className="text-sm">{job.incident_address}</p>
            <div className="mt-3 flex aspect-square items-center justify-center rounded-2xl border border-dashed border-border bg-surfaceAlt text-xs text-muted">
              Map view coming soon
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              {job.status === 'accepted' && (
                <Button onClick={() => updateStatus('en_route')} disabled={updating} className="w-full" variant="secondary">{updating ? 'Starting...' : 'Start en route'}</Button>
              )}
              {job.status === 'en_route' && (
                <Button onClick={() => updateStatus('arrived')} disabled={updating} className="w-full" variant="secondary">{updating ? 'Marking...' : 'Mark arrived'}</Button>
              )}
              {job.status === 'arrived' && (
                <Button onClick={() => updateStatus('in_progress')} disabled={updating} className="w-full" variant="secondary">{updating ? 'Starting...' : 'Start work'}</Button>
              )}
              {job.status === 'in_progress' && (
                <Button onClick={() => updateStatus('completed')} disabled={updating} className="w-full">{updating ? 'Completing...' : 'Complete job'}</Button>
              )}
              {['pending', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(job.status) && (
                <Button onClick={cancelJob} disabled={updating} variant="danger" className="w-full">Cancel request</Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}
