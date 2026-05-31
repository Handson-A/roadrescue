'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PageWrapper from '@/components/layout/PageWrapper'
import RescueMap from '@/components/map/RescueMap'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { timeAgo } from '@/lib/utils'
import { ShieldCheck, Radio, AlertCircle, Wrench, DollarSign } from 'lucide-react'

export default function MechanicPage() {
  const { user } = useAuth()
  const [incomingJobs, setIncomingJobs] = useState([])
  const [activeJobs, setActiveJobs] = useState([])
  const [available, setAvailable] = useState(false)
  const [mechProfile, setMechProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let mounted = true

    async function loadJobs() {
      const supabase = createClient()
      
      const { data: mechanicData } = await supabase
        .from('mechanic_profiles')
        .select('business_name, is_available, verification_status, current_status, service_radius_km, hourly_rate')
        .eq('user_id', user.id)
        .maybeSingle()

      const { data: pending } = await supabase
        .from('rescue_requests')
        .select('id, status, service_type, problem_description, incident_address, created_at, estimated_price')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      const { data: active } = await supabase
        .from('rescue_requests')
        .select(`
          id,
          status,
          service_type,
          problem_description,
          incident_address,
          created_at,
          driver:driver_id (id, full_name, phone)
        `)
        .eq('mechanic_id', user.id)
        .in('status', ['accepted', 'en_route', 'arrived', 'in_progress'])
        .order('created_at', { ascending: false })

      if (mounted) {
        setMechProfile(mechanicData || null)
        setAvailable(Boolean(mechanicData?.is_available))
        setIncomingJobs(pending || [])
        setActiveJobs(active || [])
        setLoading(false)
      }
    }

    loadJobs()
    const interval = setInterval(loadJobs, 10000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [user?.id])

  const toggleAvailability = async () => {
    const nextAvailability = !available
    setAvailable(nextAvailability)
    const supabase = createClient()
    await supabase.from('mechanic_profiles').update({ is_available: nextAvailability }).eq('user_id', user.id)
  }

  return (
    <PageWrapper 
      title="Service Console" 
      description="Track active roadside service jobs, update job progress states, and accept incoming service requests nearby."
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
        
        {/* ================= TOP DISPATCH POOL CONTROLLER ================= */}
        <div className={`rounded-2xl border p-5 transition-all duration-300 ${available ? 'bg-emerald-50/60 border-emerald-200/80' : 'bg-[#F3F4F6] border-slate-200'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${available ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-200 text-slate-500 border-slate-300'}`}>
                <Radio size={20} className={available ? 'animate-pulse' : ''} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Duty Status</span>
                <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">
                  {available ? 'Online & Receiving Requests' : 'Offline from Dispatch Pool'}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 font-medium">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 capitalize">
                    <ShieldCheck size={13} /> {mechProfile?.verification_status || 'Verification Pending'}
                  </span>
                  <span>•</span>
                  <span>Coverage: {mechProfile?.service_radius_km ?? '—'} km radius</span>
                </div>
              </div>
            </div>
            <Button 
              variant={available ? 'outline' : 'primary'} 
              onClick={toggleAvailability}
              className={`h-11 px-6 font-bold uppercase tracking-wider text-xs rounded-xl shadow-sm active:scale-98 transition-all ${available ? 'border-slate-300 bg-white hover:bg-slate-50' : 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-slate-900'}`}
            >
              {available ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>
        </div>

        {/* ================= REFINED COUNTER GRID (NO DUPLICATION) ================= */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Jobs</span>
              <Wrench size={16} className="text-slate-400" />
            </div>
            <p className="mt-2 text-4xl font-black text-[#111827] tracking-tight">{activeJobs.length}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Assigned requests in progress</p>
          </Card>
          
          <Card className={`rounded-xl p-5 shadow-sm border transition-colors ${incomingJobs.length > 0 && available ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Incoming Requests</span>
              <AlertCircle size={16} className={incomingJobs.length > 0 && available ? 'text-amber-500' : 'text-slate-400'} />
            </div>
            <p className="mt-2 text-4xl font-black text-[#111827] tracking-tight">{incomingJobs.length}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Unassigned breakdowns nearby</p>
          </Card>

          <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hourly Base Rate</span>
              <DollarSign size={16} className="text-slate-400" />
            </div>
            <p className="mt-2 text-4xl font-black text-[#111827] tracking-tight">
              {mechProfile?.hourly_rate ? `$${Number(mechProfile.hourly_rate).toFixed(0)}` : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Standard structural rate setup</p>
          </Card>
        </div>

        {/* ================= PRIMARY CONSOLE WORKING INTERFACE ================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* LEFT AREA: MAP WITH INLINE CONDITIONAL RADAR STATE */}
          <div className="space-y-4 lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Live Dispatch Target Radar</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/40">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
                  {activeJobs.length > 0 ? 'Active Tracking' : 'Radar Scanning'}
                </span>
              </div>
              
              {activeJobs.length > 0 ? (
                <RescueMap request={activeJobs[0]} height="370px" />
              ) : (
                <div className="h-[370px] bg-slate-50/40 flex flex-col items-center justify-center p-6 text-center border-t border-slate-100">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200/60 shadow-sm">
                    <Radio size={20} className={available ? "animate-pulse text-amber-500" : "text-slate-400"} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {available ? 'Awaiting Dispatch Coordinates' : 'System Offline'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1 font-medium leading-relaxed">
                    {available 
                      ? 'Your target tracker radar is online. Once you review and accept an incoming emergency request, the routing path map will populate here.' 
                      : 'Toggle your duty status to online above to join the vehicle service dispatch pool and initialize your mapping radar.'}
                  </p>
                </div>
              )}
            </div>

            {activeJobs.length > 0 && (
              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Active Job Queues</h3>
                  <span className="text-xs font-medium text-emerald-600">Keep these moving</span>
                </div>
                <div className="space-y-3">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-slate-200 transition-all">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge label={job.status} variant={job.status} dot />
                            <Badge label={job.service_type} variant="default" />
                          </div>
                          <p className="mt-2.5 text-sm font-bold text-slate-900 leading-snug">{job.problem_description}</p>
                          <p className="mt-1 text-xs text-slate-500 font-medium">{job.incident_address || 'Location coordinates pending'}</p>
                        </div>
                        <Link href={`/dashboard/mechanic/job/${job.id}`} className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 transition-colors">
                          Open Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT AREA: STREAMLINED LIVE BREAKDOWN CHANNELS */}
          <div className="space-y-4 lg:col-span-5">
            <Card className="p-0 overflow-hidden border-slate-200 bg-white shadow-sm rounded-2xl">
              <div className="border-b border-slate-100 bg-slate-900 px-4 py-3.5 text-white flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#FFD700]">Urgent Broadcast Feed</h4>
                {incomingJobs.length > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />}
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="py-12 flex justify-center"><Spinner /></div>
                ) : incomingJobs.length === 0 ? (
                  <p className="py-8 text-center text-xs font-medium text-slate-400">No open corridor breakdown alerts right now.</p>
                ) : (
                  <div className="space-y-3">
                    {incomingJobs.map((job) => (
                      <div key={job.id} className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5 hover:border-slate-200 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <Badge label={job.service_type} variant="pending" dot />
                          <span className="text-[11px] font-medium text-slate-400">{timeAgo(job.created_at)}</span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-slate-900">{job.problem_description}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{job.incident_address || 'Location pending'}</p>
                        <Link href={`/dashboard/mechanic/job/${job.id}`} className="mt-3.5 inline-flex h-9 w-full items-center justify-center rounded-xl bg-slate-900 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 transition-all">
                          Review Request
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* LOWER ASSISTANCE SIDEBAR SUMMARY CARD */}
            <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Payout Estimates</h4>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{incomingJobs.length} Live</span>
              </div>
              <div className="space-y-2">
                {incomingJobs.length === 0 ? (
                  <div className="py-3 text-center text-xs font-medium text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Awaiting dispatch signals...
                  </div>
                ) : (
                  incomingJobs.slice(0, 2).map((job) => (
                    <div key={job.id} className="rounded-xl border border-slate-50 bg-slate-50/40 px-3.5 py-2.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate capitalize">{job.service_type.replace('_', ' ')}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{job.incident_address || 'Route mapped'}</p>
                      </div>
                      <span className="text-sm font-black text-slate-900 shrink-0">
                        {job.estimated_price ? `$${Number(job.estimated_price).toFixed(0)}` : '$—'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

          </div>
        </div>
      </div>
    </PageWrapper>
  )
}