'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import PageWrapper from '@/components/layout/PageWrapper'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'

const filters = ['all', 'completed', 'cancelled']

export default function DriverHistoryPage() {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [filter, setFilter] = useState('all')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    let mounted = true

    async function loadHistory() {
      setLoading(true)
      const { data } = await supabase
        .from('rescue_requests')
        .select('id, status, service_type, problem_description, incident_address, created_at')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })

      if (mounted) {
        setRequests(data || [])
        setLoading(false)
      }
    }

    loadHistory()

    return () => {
      mounted = false
    }
  }, [user?.id, supabase])

  const rows = useMemo(() => {
    if (filter === 'all') return requests
    return requests.filter((request) => request.status === filter)
  }, [requests, filter])

  return (
    <PageWrapper title="Request history" description="Review completed and cancelled rescue dispatches.">
      <Card className="mb-4 bg-[#F3F4F6]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#7C7767]">Rescue archive</p>
            <h2 className="mt-1 text-xl font-semibold">Past dispatches</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={[
                  'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition',
                  filter === key ? 'bg-[#111827] text-[#F3F4F6] shadow-soft' : 'bg-[#F3F4F6] text-[#7C7767] hover:bg-[#111827]/5',
                ].join(' ')}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="bg-[#F3F4F6]">
          <div className="py-12 flex justify-center"><Spinner /></div>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="bg-[#F3F4F6]">
          <div className="py-12 text-center text-sm text-[#7C7767]">No requests in this filter.</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((request) => (
            <Link key={request.id} href={`/dashboard/driver/request/${request.id}`}>
              <Card className="cursor-pointer bg-[#F3F4F6] hover:-translate-y-0.5 hover:shadow-lift transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#111827]">{request.service_type?.replace('_', ' ')}</p>
                    <p className="mt-1 truncate text-sm text-[#7C7767]">{request.problem_description}</p>
                    <p className="mt-2 truncate text-xs text-[#7C7767]">{request.incident_address || 'Address pending'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge label={request.status} variant={request.status} dot />
                    <p className="mt-2 text-[11px] text-[#7C7767]">{timeAgo(request.created_at)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}