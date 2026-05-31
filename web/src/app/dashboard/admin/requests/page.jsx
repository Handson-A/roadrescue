'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { timeAgo } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Radar, MapPin, User, HardHat, FileText, ArrowRight } from 'lucide-react'

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

  // Helper mapping to generate color tokens for active status chips dynamically
  const getFilterStyle = (status) => {
    if (filter !== status) return 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
    
    switch (status) {
      case 'all': return 'bg-slate-900 text-white border-slate-900 shadow-sm'
      case 'pending': return 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/10'
      case 'accepted': case 'en_route': case 'arrived': case 'in_progress': 
        return 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/10'
      case 'completed': return 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/10'
      case 'cancelled': return 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/10'
      default: return 'bg-slate-900 text-white border-slate-900 shadow-sm'
    }
  }

  return (
    <PageWrapper 
      title="Global Incident Log" 
      description="Monitor the full dispatch queue infrastructure, track breakdown timelines, and filter by live lifecycle status."
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-12">
        
        {/* ================= FILTER CHIPS BAR SCROLLER ================= */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200/60 pb-5">
          {['all', 'pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 duration-150 ${getFilterStyle(status)}`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* ================= PRIMARY INCIDENTS LOG CONTAINER FEED ================= */}
        <div className="w-full space-y-3.5">
          {loading ? (
            <Card className="rounded-2xl border-slate-200 bg-white py-20 flex justify-center shadow-sm">
              <Spinner />
            </Card>
          ) : requests.length === 0 ? (
            /* Premium visual empty state layout */
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/40 py-16 px-4 text-center max-w-md mx-auto mt-10">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-3.5 border border-slate-200/60 shadow-sm">
                <Radar size={20} className="text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Incidents Documented</h3>
              <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400 font-medium leading-relaxed">
                There are currently no roadside breakdown tickets active under the selected status configuration criteria.
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all group">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={request.status} variant={request.status} dot />
                      <Badge label={request.service_type || 'Rescue Order'} variant="default" />
                      <span className="text-[11px] font-medium text-slate-400">{timeAgo(request.created_at)}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900 tracking-tight capitalize leading-snug">
                        {request.problem_description || 'Roadside Assistance Request'}
                      </h4>
                      <p className="mt-1 text-xs font-medium text-slate-500 flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        {request.incident_address || 'GPS Coordinates Pending'}
                      </p>
                    </div>

                    {/* Meta User Identity Badges */}
                    <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-50 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] tracking-wide text-slate-400 uppercase font-bold">Driver:</span>
                        <span className="text-slate-700 truncate">{request.driver?.full_name || 'Anonymous User'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <HardHat size={13} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] tracking-wide text-slate-400 uppercase font-bold">Mechanic:</span>
                        <span className={`truncate ${request.mechanic?.full_name ? 'text-slate-700' : 'text-amber-600 italic font-medium'}`}>
                          {request.mechanic?.full_name || 'Awaiting Allocation'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Interaction Anchor Button */}
                  <Link 
                    href={`/dashboard/admin/requests/${request.id}`}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 transition-colors self-start lg:self-center w-full lg:w-auto"
                  >
                    <FileText size={13} />
                    <span>Open Record</span>
                    <ArrowRight size={13} className="transform group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                </div>
              </Card>
            ))
          )}
        </div>

      </div>
    </PageWrapper>
  )
}