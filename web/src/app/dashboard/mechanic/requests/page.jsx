'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'
import { Radio, RefreshCw, AlertTriangle, ArrowRight, MapPin } from 'lucide-react'

export default function MechanicRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Isolated data fetching engine
  async function loadRequests() {
    const supabase = createClient()
    const { data } = await supabase
      .from('rescue_requests')
      .select('id, status, service_type, problem_description, incident_address, created_at')
      .eq('status', 'pending') // Only show actual unassigned incoming work
      .order('created_at', { ascending: false })
      .limit(20)
    
    setRequests(data || [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    let mounted = true
    const initialTimer = setTimeout(() => {
      if (mounted) loadRequests()
    }, 0)
    
    // Polling backup to seamlessly capture new incidents every 15 seconds
    const interval = setInterval(() => {
      if (mounted) loadRequests()
    }, 15000)
    
    return () => { 
      mounted = false 
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    await loadRequests()
  }

  return (
    <PageWrapper 
      title="Live Dispatch" 
      description="Monitor local unassigned breakdown incidents and incoming roadside emergencies within your zone."
    >
      <div className="mx-auto max-w-4xl space-y-5 pb-12">
        
        {/* ================= REFINED CONTROL ROW HEADER ================= */}
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Available Feed Logs ({requests.length})</h2>
          </div>
          
          <Button 
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            
          </Button>
        </div>

        {/* ================= INCIDENT CONTROLLER LOG FEED ================= */}
        <div className="space-y-3.5">
          {loading ? (
            <Card className="rounded-2xl border-slate-200 bg-white py-16 flex justify-center shadow-sm">
              <Spinner />
            </Card>
          ) : requests.length === 0 ? (
            /* Premium visual layout fallback when unassigned queue hits zero */
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/40 py-16 px-4 text-center max-w-md mx-auto mt-8">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-3.5">
                <Radio size={20} className="text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Clear Broadcast Horizon</h3>
              <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400 font-medium leading-relaxed">
                There are currently no open roadside breakdown tickets requiring technician deployment. Keep this console open to capture live tracking signals.
              </p>
            </div>
          ) : (
            requests.map((req) => (
              <Card key={req.id} className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-all group">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={req.service_type} variant="pending" dot />
                      <span className="text-[11px] font-medium text-slate-400">{timeAgo(req.created_at)}</span>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-bold text-slate-900 truncate tracking-tight capitalize">
                        {req.problem_description || `${req.service_type.replace('_', ' ')} Rescue`}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-slate-500 flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        {req.incident_address || 'GPS Coordinates Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Operational Interaction Anchor Node */}
                  <div className="flex items-center justify-between gap-4 border-t border-slate-50 pt-3 sm:border-0 sm:pt-0 shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 sm:text-right block">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    <Link 
                      href={`/dashboard/mechanic/job/${req.id}`}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 transition-colors"
                    >
                      <span>Review</span>
                      <ArrowRight size={13} className="transform group-hover:translate-x-0.5 transition-transform" />
                    </Link>
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