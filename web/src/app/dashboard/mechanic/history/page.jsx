'use client'

import { useState, useEffect } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { timeAgo } from '@/lib/utils'

export default function MechanicHistoryPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  

  useEffect(() => {
    if (!user?.id) return
    let mounted = true
    async function loadHistory() {
      const supabase = createClient()
      if (mounted) setLoading(true)
      const { data, error } = await supabase
        .from('rescue_requests')
        .select(`
          id,
          status,
          service_type,
          problem_description,
          completed_at,
          driver_rating,
          driver_review,
          created_at,
          driver:driver_id (id, full_name)
        `)
        .eq('mechanic_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      if (!error && mounted) {
        setJobs(data || [])
      }
      if (mounted) setLoading(false)
    }

    loadHistory()
    return () => {
      mounted = false
    }
  }, [user?.id])

  const avgRating = jobs.length > 0
    ? (jobs.reduce((sum, j) => sum + (j.driver_rating || 0), 0) / jobs.length).toFixed(1)
    : 0

  return (
    <PageWrapper title="Job history" description="Review completed rescues and customer feedback.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <Card>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Completed jobs</p>
            <p className="mt-2 text-3xl font-semibold">{jobs.length}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Average rating</p>
            <p className="mt-2 text-3xl font-semibold">⭐ {avgRating}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">This month</p>
            <p className="mt-2 text-3xl font-semibold">{jobs.filter((j) => new Date(j.completed_at).getMonth() === new Date().getMonth()).length}</p>
          </div>
        </Card>
      </div>

      <Card>
        {loading ? (
          <div className="py-12 flex justify-center">
            <Spinner />
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">No completed jobs yet.</div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:-translate-y-0.5 hover:shadow-lift transition">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={job.service_type} variant="completed" dot />
                      <span className="text-xs text-muted">{timeAgo(job.completed_at)}</span>
                    </div>
                    <p className="mt-3 text-lg font-semibold truncate">{job.driver?.full_name}</p>
                    <p className="mt-1 text-sm text-muted truncate">{job.driver_review || 'No review left'}</p>
                  </div>
                  <div className="text-sm text-muted lg:text-right">
                    <p>{job.driver_rating ? `⭐ ${job.driver_rating}/5` : 'Unrated'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </PageWrapper>
  )
}
