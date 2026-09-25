'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { timeAgo } from '@/lib/utils'
import { Radio, AlertCircle, Wrench, DollarSign, ShieldCheck, X, AlertTriangle, MapPin, Star, Navigation } from 'lucide-react'
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
        .select('business_name, years_experience, is_available, rating_avg, rating_count')
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
      <div className="w-full min-h-fit bg-transparent flex items-center justify-center py-12 lg:pl-64">
        <div className="text-center space-y-3">
          <Spinner />
          <p className="text-xs font-mono font-black text-[#7C6B44] uppercase tracking-widest animate-pulse">please wait...</p>
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-6 pb-12">
        
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
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span>{mechProfile?.rating_avg ? Number(mechProfile.rating_avg).toFixed(1) : '5.0'} ({mechProfile?.rating_count ?? 0} reviews)</span>
                  </span>
                </div>
              </div>
            </div>
            <Button 
              variant={isAvailable ? 'outline' : 'primary'} 
              onClick={handleAvailabilityToggle}
              className={`h-11 px-6 font-bold uppercase tracking-wider text-xs rounded-xl shadow-sm active:scale-98 transition-all ${isAvailable ? 'border-slate-300 bg-white hover:bg-slate-50' : 'bg-primary hover:bg-primary/90 text-slate-900'}`}
            >
              {isAvailable ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>
        </div>

        {/* ================= COUNTER GRID ================= */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
          <Card className="rounded-xl border-slate-200 bg-white p-3.5 sm:p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider md:tracking-widest text-slate-400 truncate">Active Jobs</span>
              <Wrench size={15} className="text-slate-400 shrink-0" />
            </div>
            <p className="mt-1 md:mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-[#111827] tracking-tight">{activeJobs.length}</p>
            <p className="mt-0.5 md:mt-1 text-[11px] md:text-xs text-slate-500 font-medium truncate">
              <span className="md:hidden">In progress</span>
              <span className="hidden md:inline">Assigned requests in progress</span>
            </p>
          </Card>
          
          <Card className={`rounded-xl p-3.5 sm:p-4 md:p-5 shadow-sm border transition-all duration-300 ${incomingJobs.length > 0 && isAvailable ? 'bg-amber-50/30 border-t-4 border-t-primary border-x-[#DCCDA9] border-b-[#DCCDA9] shadow-md shadow-amber-400/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider md:tracking-widest text-slate-400 truncate">Incoming Requests</span>
              <AlertCircle size={15} className={`shrink-0 ${incomingJobs.length > 0 && isAvailable ? 'text-[#8A6B08]' : 'text-slate-400'}`} />
            </div>
            <p className="mt-1 md:mt-2 text-2xl sm:text-3xl md:text-4xl font-black text-[#111827] tracking-tight">{incomingJobs.length}</p>
            <p className="mt-0.5 md:mt-1 text-[11px] md:text-xs text-slate-500 font-medium truncate">
              <span className="md:hidden">Unassigned nearby</span>
              <span className="hidden md:inline">Unassigned breakdowns nearby</span>
            </p>
          </Card>

          {/* Operation Center - Reference info hidden on mobile (below md / 768px) */}
          <Card className="hidden md:block rounded-xl border-slate-200 bg-white p-5 shadow-sm">
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
        <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
          
          {/* LEFT AREA: MAP MODULE (DESKTOP ONLY) & ACTIVE JOBS */}
          <div className="space-y-4 lg:col-span-7 flex flex-col">
            
            {/* Desktop-only Map View: on mobile, map is exclusively accessed via Navigation tab */}
            <div className="hidden lg:flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex-col">
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
                <RescueMap 
                  request={targetMapRequest} 
                  mechanicLocation={localCoords}
                  incomingJobs={incomingJobs}
                  isRadarMode={activeJobs.length === 0}
                  isOnline={isAvailable}
                  userRole="mechanic"
                  height="100%" 
                />
              </div>
            </div>

            {/* Active Jobs Card */}
            {activeJobs.length > 0 ? (
              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 flex-1">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">Active Assigned Jobs ({activeJobs.length})</h3>
                  </div>
                  <Link 
                    href="/dashboard/mechanic/navigation" 
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <Navigation size={13} />
                    <span>Open Navigation</span>
                  </Link>
                </div>
                <div className="space-y-3">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 hover:border-slate-300 transition-all shadow-xs">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge label={job.status} variant={job.status} dot />
                            <Badge label={job.service_type} variant="default" />
                          </div>
                          <p className="mt-2 text-sm font-bold text-slate-900 leading-snug break-words">{job.problem_description}</p>
                          <p className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400 shrink-0" /> 
                            <span className="truncate">{job.incident_address || 'Location coordinates pending'}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                          <Link 
                            href={`/dashboard/mechanic/job/${job.id}`} 
                            className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors"
                          >
                            Details
                          </Link>
                          <Link 
                            href="/dashboard/mechanic/navigation" 
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 transition-colors"
                          >
                            <Navigation size={13} />
                            <span>Navigate</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-center items-center py-8 text-center text-slate-400 lg:hidden">
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-2 text-slate-400">
                  <Wrench size={18} />
                </div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">No Active Assigned Jobs</h4>
                <p className="text-[11px] max-w-xs mt-1 font-medium leading-relaxed">
                  {isAvailable ? 'Standing by for new dispatches. Check incoming requests below.' : 'You are currently offline. Go online to receive emergency dispatches.'}
                </p>
              </Card>
            )}
          </div>

          {/* RIGHT AREA: INCIDENT BROADCAST FEEDS */}
          <div className="space-y-4 lg:col-span-5">
            <Card className="p-0 overflow-hidden border-slate-200 bg-white shadow-sm rounded-2xl">
              <div className="border-b border-slate-100 bg-slate-900 px-4 py-3.5 text-white flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-primary">Urgent Broadcast Feed</h4>
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
                        <p className="mt-2 text-sm font-bold text-slate-900 break-words">{job.problem_description}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500 truncate">{job.incident_address || 'Location pending'}</p>
                        <Link href={`/dashboard/mechanic/job/${job.id}`} className="mt-3.5 inline-flex h-9 w-full items-center justify-center rounded-xl bg-slate-900 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 transition-all">
                          Review Request
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-center items-center py-6 text-center text-slate-400">
              <div className="h-9 w-9 rounded-xl bg-slate-50 border flex items-center justify-center mb-2 text-slate-400 shadow-2xs">
                <AlertCircle size={16} />
              </div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {isAvailable ? 'Network Dispatch Node Active' : 'Dispatch Node Inactive (Offline)'}
              </h4>
              <p className="text-[11px] max-w-xs mt-1 font-medium leading-relaxed">
                {isAvailable 
                  ? 'When active, your unit is visible to stranded drivers within your service radius.' 
                  : 'Switch your duty status to Online to appear on the dispatch radar.'}
              </p>
            </Card>
          </div>

        </div>
      </div>

      <Modal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        title="Disconnect from Dispatch?"
        size="sm"
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => executeStatusUpdate(false)}
              className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-600 hover:bg-red-50/50 cursor-pointer"
            >
              Confirm Offline
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowOfflineModal(false)}
              className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-primary hover:bg-primary/90 shadow-sm cursor-pointer"
            >
              Stay Online
            </Button>
          </>
        }
      >
        <div className="rounded-xl bg-[#FFF9EF] border border-[#E8DCC0] p-4">
          <p className="text-xs text-[#6C5E3B] font-medium leading-relaxed">
            Going offline removes your workshop profile from the active emergency network. You will not receive nearby breakdown alerts until you reconnect.
          </p>
        </div>
      </Modal>

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