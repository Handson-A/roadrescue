'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import Badge from '@/components/ui/Badge'
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
    // FIXED: Appended lg:pl-64 structural layout gutters to isolate sidebar footprint
    <div className="w-full min-h-screen bg-[#FFF8EA] text-[#1F1B10] p-4 sm:p-6 lg:pl-64 flex justify-center items-start pb-24 lg:pb-8">
      <div className="w-full max-w-2xl flex flex-col gap-4">
        
        <div className="flex items-center gap-3 rounded-2xl border border-[#DCCDA9] bg-[#FFF9EF] p-4 shadow-sm">
          
          <div>
            <h1 className="text-lg font-black tracking-tight text-[#1F1B10]">Request History</h1>
            <p className="text-xs text-[#7C6B44] font-medium">Review past dispatches and archives</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#DCCDA9] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7C6B44]">Rescue Archive</p>
              <h2 className="mt-0.5 text-base font-black text-[#1F1B10]">Past Dispatches</h2>
            </div>
            
            <div className="flex flex-wrap gap-1.5 bg-[#FFF9EF] p-1 rounded-xl border border-[#E0D5B7] self-start sm:self-auto">
              {filters.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={[
                    'rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all duration-200',
                    filter === key 
                      ? 'bg-[#1F1B10] text-white shadow-sm' 
                      : 'text-[#7C6B44] hover:text-[#1F1B10] hover:bg-white/50',
                  ].join(' ')}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#DCCDA9] bg-white p-12 flex justify-center shadow-sm">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-[#DCCDA9] bg-white p-12 text-center text-xs font-bold text-slate-400 shadow-sm">
            No logged requests found matching this filter tier.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((request) => (
              <Link key={request.id} href={`/dashboard/driver/request/${request.id}`} className="block">
                <div className="rounded-2xl border border-[#DCCDA9] bg-white p-4 shadow-sm hover:border-[#b8aa85] transition-all duration-200 active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#1F1B10] capitalize">
                        {request.service_type?.replace('_', ' ')}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
                        {request.problem_description}
                      </p>
                      <p className="mt-2 truncate font-mono text-[10px] text-[#7C6B44]">
                        📍 {request.incident_address || 'Address pinpoint active'}
                      </p>
                    </div>
                    
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <Badge label={request.status} variant={request.status} dot />
                      <p className="text-[10px] font-bold text-slate-400">
                        {timeAgo(request.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}