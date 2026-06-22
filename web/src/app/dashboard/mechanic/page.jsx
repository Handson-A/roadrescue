'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { timeAgo } from '@/lib/utils'
import { Radio, AlertCircle, Wrench, DollarSign, ShieldCheck, X, AlertTriangle, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMechanicStatus } from '@/hooks/useMechanicStatus'

const RescueMap = dynamic(
  () => import('@/components/map/RescueMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[370px] flex items-center justify-center bg-slate-50 border rounded-2xl">
        <Spinner />
      </div>
    ),
  }
)

export default function MechanicPage() {
  const { user } = useAuth()
  const [incomingJobs, setIncomingJobs] = useState([])
  const [activeJobs, setActiveJobs] = useState([])
  const [mechProfile, setMechProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [jobSearchResults, setJobSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  const userIdRef = useRef(user?.id)
  const searchParams = useSearchParams()
  const { isAvailable, updateStatus, localCoords } = useMechanicStatus(user?.id)

  useEffect(() => {
    const q = searchParams.get('search') || ''
    Promise.resolve().then(() => {
      setSearchQuery(q)
    })
  }, [searchParams])

  useEffect(() => {
    userIdRef.current = user?.id
    if (!userIdRef.current) return
    let mounted = true

    async function loadJobs() {
      const currentUserId = userIdRef.current
      if (!currentUserId) return

      const supabase = createClient()

      const { data: mechanicData, error: profileErr } = await supabase
        .from('mechanic_profiles')
        .select('business_name, years_experience, is_available')
        .eq('user_id', currentUserId)
        .maybeSingle()

      if (profileErr) console.error('[DB EXCEPTION] Profile fetch:', profileErr.message)

      const { data: pending, error: pendingErr } = await supabase
        .from('rescue_requests')
        .select('id, status, service_type, problem_description, incident_address, incident_location, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (pendingErr) console.error('[DB EXCEPTION] Pending fetch:', pendingErr.message)

      // FIXED: Cleaned and unified the active request tracking assignment query chain
const { data: active, error: activeErr } = await supabase
  .from('rescue_requests')
  .select(`
    id,
    status,
    service_type,
    problem_description,
    incident_address,
    incident_location,
    created_at,
    incident_lat,
    incident_lng,
    driver:profiles!rescue_requests_driver_id_fkey (id, full_name, phone)
  `)
  .eq('mechanic_id', currentUserId)
  .in('status', ['accepted', 'en_route', 'arrived', 'in_progress'])
  .order('created_at', { ascending: false })

      if (activeErr) console.error('[DB EXCEPTION] Active fetch:', activeErr.message)

      if (mounted && userIdRef.current) {
        setMechProfile(mechanicData || null)
        setIncomingJobs(pending || [])
        setActiveJobs(active || [])
        setLoading(false)
      }
    }

    loadJobs()
    const interval = setInterval(loadJobs, 10000)

    const supabase = createClient()
    const channel = supabase
      .channel('mechanic-dashboard-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rescue_requests' },
        () => {
          loadJobs()
        }
      )
      .subscribe()

    return () => {
      mounted = false
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  useEffect(() => {
    if (!searchQuery) {
      Promise.resolve().then(() => {
        setJobSearchResults([])
        setHasSearched(false)
      })
      return
    }

    let mounted = true
    Promise.resolve().then(() => {
      setSearchLoading(true)
      setHasSearched(true)
    })

    async function searchJobs() {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const json = await res.json()
        if (mounted) setJobSearchResults(json.results || [])
      } catch (err) {
        console.error('[MECHANIC SEARCH]:', err)
      } finally {
        if (mounted) setSearchLoading(false)
      }
    }

    searchJobs()
    return () => { mounted = false }
  }, [searchQuery])

  const handleAvailabilityToggle = async () => {
    if (isAvailable) {
      setShowOfflineModal(true)
    } else {
      try {
        await updateStatus('available')
        toast.success('Duty status configured: Online')
      } catch (e) {
        toast.error('Failed to go online')
      }
    }
  }

  const executeStatusUpdate = async (nextAvailable) => {
    setShowOfflineModal(false)
    try {
      await updateStatus(nextAvailable ? 'available' : 'offline')
      toast.success(`Duty status configured: ${nextAvailable ? 'Online' : 'Offline'}`)
    } catch (err) {
      console.error('[STATUS FAULT]:', err?.message || err)
      toast.error('Failed to update duty status')
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#FFF8EA] flex items-center justify-center lg:pl-64">
        <div className="text-center space-y-3">
          <Spinner />
          <p className="text-xs font-mono font-black text-[#7C6B44] uppercase tracking-widest animate-pulse">Synchronizing Radio Terminals...</p>
        </div>
      </div>
    )
  }

  // FIXED: Logic gateway mapping targeted parameters seamlessly down onto the map frame
  const targetMapRequest = activeJobs.length > 0 
    ? activeJobs[0] 
    : incomingJobs.length > 0 
      ? incomingJobs[0] 
      : null

  return (
    <PageWrapper 
      title="Service Console" 
      description="Track active roadside service jobs, update job progress states, and accept incoming service requests nearby."
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
        
        {/* ================= TOP DISPATCH POOL CONTROLLER ================= */}
        <div className={`rounded-2xl border p-5 transition-all duration-300 ${isAvailable ? 'bg-emerald-50/60 border-emerald-200/80' : 'bg-slate-100 border-slate-200'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${isAvailable ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-200 text-slate-500 border-slate-300'}`}>
                <Radio size={20} className={isAvailable ? 'animate-pulse' : ''} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Duty Status</span>
                <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">
                  {isAvailable ? 'Online & Receiving Requests' : 'Offline from Dispatch Pool'}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 font-medium">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 capitalize">
                    <ShieldCheck size={13} /> Console Stream Secure
                  </span>
                  <span>•</span>
                  <span>Experience: {mechProfile?.years_experience ?? '0'} Years Vetted</span>
                </div>
              </div>
            </div>
            <Button 
              variant={isAvailable ? 'outline' : 'primary'} 
              onClick={handleAvailabilityToggle}
              className={`h-11 px-6 font-bold uppercase tracking-wider text-xs rounded-xl shadow-sm active:scale-98 transition-all ${isAvailable ? 'border-slate-300 bg-white hover:bg-slate-50' : 'bg-[#F5D108] hover:bg-[#F5D108]/90 text-slate-900'}`}
            >
              {isAvailable ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>
        </div>

        {/* ================= COUNTER GRID ================= */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Jobs</span>
              <Wrench size={16} className="text-slate-400" />
            </div>
            <p className="mt-2 text-4xl font-black text-[#111827] tracking-tight">{activeJobs.length}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Assigned requests in progress</p>
          </Card>
          
          <Card className={`rounded-xl p-5 shadow-sm border transition-colors ${incomingJobs.length > 0 && isAvailable ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Incoming Requests</span>
              <AlertCircle size={16} className={incomingJobs.length > 0 && isAvailable ? 'text-amber-500' : 'text-slate-400'} />
            </div>
            <p className="mt-2 text-4xl font-black text-[#111827] tracking-tight">{incomingJobs.length}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Unassigned breakdowns nearby</p>
          </Card>

          <Card className="rounded-xl border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operation Center</span>
              <DollarSign size={16} className="text-slate-400" />
            </div>
            <p className="mt-2 text-xl font-black text-[#111827] truncate tracking-tight pt-1.5">
              {mechProfile?.business_name || 'Independent Specialist'}
            </p>
            <p className="mt-2.5 text-xs text-slate-500 font-medium">Active terminal identity node</p>
          </Card>
        </div>

        {/* ================= PRIMARY CONSOLE WORKING INTERFACE ================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* LEFT AREA: MAP MODULE */}
          <div className="space-y-4 lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
              <div className="bg-slate-50 border-b border-slate-200/60 px-4 py-3.5 flex items-center justify-between z-20">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Live Tracking</span>
                  <h3 className="text-sm font-black text-slate-900 m-0">Route and Location Feed</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeJobs.length > 0 ? 'Active System Track' : 'Radar Scanning'}
                </span>
              </div>
              
              <div className="w-full h-[370px] relative overflow-hidden bg-slate-50 rounded-b-2xl z-10">
                {/* FIXED: Form parameters match current location metrics explicitly */}
                <RescueMap 
                  request={targetMapRequest} 
                  mechanicLocation={localCoords}
                  incomingJobs={incomingJobs}
                  isRadarMode={activeJobs.length === 0}
                  isOnline={isAvailable}
                  height="100%" 
                />
              </div>
            </div>

            {activeJobs.length > 0 && (
              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5">
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
                          <p className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" /> {job.incident_address || 'Location coordinates pending'}
                          </p>
                        </div>
                        <Link href={`/dashboard/mechanic/job/${job.id}`} className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 transition-colors self-center">
                          Open Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT AREA: INCIDENT BROADCAST FEEDS */}
          <div className="space-y-4 lg:col-span-5">
            <Card className="p-0 overflow-hidden border-slate-200 bg-white shadow-sm rounded-2xl">
              <div className="border-b border-slate-100 bg-slate-900 px-4 py-3.5 text-white flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#F5D108]">Urgent Broadcast Feed</h4>
                {incomingJobs.length > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />}
              </div>
              <div className="p-4">
                {incomingJobs.length === 0 ? (
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

            <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-center items-center py-12 text-center text-slate-400">
              <div className="h-9 w-9 rounded-xl bg-slate-50 border flex items-center justify-center mb-2.5 text-slate-400 shadow-2xs">
                <AlertCircle size={16} />
              </div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Network Node Active</h4>
              <p className="text-[11px] max-w-[200px] mt-1 font-medium leading-relaxed">System mapping radar is polling your PostGIS geometric location loop metrics cleanly.</p>
            </Card>
          </div>

        </div>
      </div>

      {/* ================= CONFIRMATION OFFLINE MODAL VECTOR ================= */}
      {showOfflineModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setShowOfflineModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="flex gap-3.5 items-start">
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Disconnect from Dispatch?</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Going offline removes your workshop profile from active emergency network nodes. Drivers nearby will not be able to broadcast breakdown signals to your console.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-2">
              <button 
                onClick={() => setShowOfflineModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Stay Online
              </button>
              <button 
                onClick={() => { executeStatusUpdate(false) }}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                Confirm Offline
              </button>
            </div>
          </Card>
        </div>
      )}

      {hasSearched && (
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
            Job search results for &quot;{searchQuery}&quot;
          </h3>
          {searchLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : jobSearchResults.length === 0 ? (
            <p className="text-xs font-medium text-slate-400 text-center py-6">No matching jobs found.</p>
          ) : (
            <div className="space-y-3">
              {jobSearchResults.map((job) => (
                <Link key={job.id} href={`/dashboard/mechanic/job/${job.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 hover:border-slate-200 transition-all">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={job.status} variant={job.status} dot />
                      <span className="text-[11px] font-medium text-slate-400">{timeAgo(job.created_at)}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">{job.problem_description}</p>
                    <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" /> {job.incident_address || 'GPS active'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}
    </PageWrapper>
  )
}