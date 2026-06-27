'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Clock3, MapPin, PhoneCall, BusFront, ExternalLink, Shield, Compass, CheckCircle2 } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import RescueMap from '@/components/map/RescueMap'
import DiagnosticResult from '@/components/ai/DiagnosticResult'
import { useRequestStatus } from '@/hooks/useRequestStatus'
import { useWatchMechanicLocation } from '@/hooks/useMechanicLocation'
import { useAuth } from '@/hooks/useAuth'
import ReportModal from '@/components/report/ReportModal'
import { timeAgo, normalizeGeoPoint, formatDistance } from '@/lib/utils'

const ACTIVE_DRIVER_REQUEST_STATUSES = ['accepted', 'en_route', 'arrived', 'in_progress']
const CANCELLATION_ALLOWED_STATUSES = ['pending', 'accepted']

// Internal mathematical helper to calculate true physical distance over earth curvature
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Returns distance in km
}

export default function DriverRequestTrackingPage() {
  const { id } = useParams()
  const router = useRouter()
  const { request, loading } = useRequestStatus(id)
  const { mechanicLocation } = useWatchMechanicLocation(id)
  const { user } = useAuth()
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const incidentLocation = request?.incident_location
  const liveDistanceText = useMemo(() => {
    if (!incidentLocation || !mechanicLocation) return null
    
    const [driverLat, driverLng] = normalizeGeoPoint(incidentLocation)
    const [mechLat, mechLng] = normalizeGeoPoint(mechanicLocation)
    
    const distanceKm = calculateHaversineDistance(driverLat, driverLng, mechLat, mechLng)
    return formatDistance(distanceKm)
  }, [incidentLocation, mechanicLocation])

  // Core orchestration logic handler for secure emergency dispatch cancellation
  async function handleCancelRequest() {
    setShowCancelModal(true)
  }

  async function confirmCancelRequest() {
    try {
      setCanceling(true)
      const response = await fetch(`/api/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'cancelled',
          cancellationReason: cancelReason.trim() || 'Driver cancelled request'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel request')
      }

      toast.success('Rescue request successfully cancelled.')
      router.push('/dashboard/driver')
    } catch (error) {
      toast.error(error.message || 'An error occurred during cancellation.')
    } finally {
      setCanceling(false)
      setShowCancelModal(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper title="Live tracking" description="Follow the assignment in realtime.">
        <div className="h-[50vh] flex items-center justify-center">
          <Spinner />
        </div>
      </PageWrapper>
    )
  }

  if (!request) {
    return (
      <PageWrapper title="Live tracking" description="Follow the assignment in realtime.">
        <Card>
          <p className="text-sm text-muted">Request not found.</p>
        </Card>
      </PageWrapper>
    )
  }

  const mechanic = request.mechanic
  const isActiveDispatch = ACTIVE_DRIVER_REQUEST_STATUSES.includes(request.status)
  const isCancellationAllowed = CANCELLATION_ALLOWED_STATUSES.includes(request.status)
  const profileData = mechanic?.mechanic_profiles?.[0] || mechanic?.mechanic_profiles
  const workshopLabel = [
    profileData?.business_name,
    profileData?.location_label,
  ].filter(Boolean).join(' · ')

  const rawRating = profileData?.rating_avg
  const hasRating = typeof rawRating === 'number' && rawRating > 0
  const ratingText = hasRating ? rawRating.toFixed(1) : 'New Responder'
  const stars = hasRating ? '★'.repeat(Math.round(rawRating)) + '☆'.repeat(5 - Math.round(rawRating)) : '☆☆☆☆☆'

  const workflowStages = [
    { key: 'pending', label: 'Finding Help', step: '1' },
    { key: 'accepted', label: 'Assigned', step: '2' },
    { key: 'en_route', label: 'On the Way', step: '3' },
    { key: 'arrived', label: 'On Site', step: '4' },
    { key: 'in_progress', label: 'Repairing', step: '5' },
    { key: 'completed', label: 'Resolved', step: '6' },
  ]

  const currentStageIndex = workflowStages.findIndex(s => s.key === request.status)

  return (
    <PageWrapper title="Live tracking" description="Track the dispatcher, assigned mechanic, and current lifecycle state.">
      
      {/* ==================================================================== */}
      {/* MOBILE DISPLAY VIEWPORT LAYOUT                                       */}
      {/* ==================================================================== */}
      <div className="space-y-4 lg:hidden">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-md border border-slate-200/80">
          <RescueMap request={request} driverLocation={request.incident_location} mechanicLocation={mechanicLocation} userRole="driver" height="320px" />
        </div>

        {/* DYNAMIC PROXIMITY TELEMETRY CARD */}
        <div className="rounded-[1.75rem] bg-[#1E1B15] p-5 text-[#EFE8D4] shadow-xl border border-white/5 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-white/[0.02] pointer-events-none">
            <Compass size={140} />
          </div>
          
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div>
              {request.status === 'pending' ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFD700] animate-pulse">📡 Broadcast Pipeline Active</p>
                  <h2 className="mt-1 text-xl font-black leading-tight text-[#EFE8D4]">Searching for nearest mechanics...</h2>
                  <p className="text-xs text-[#A29A84] mt-1">Signals matching across your local district window.</p>
                </>
              ) : request.status === 'arrived' ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">⚡ Touchdown</p>
                  <h2 className="mt-1 text-xl font-black leading-tight text-[#EFE8D4]">Mechanic is on site</h2>
                  <p className="text-xs text-[#A29A84] mt-1">Verify credentials before field adjustments initiate.</p>
                </>
              ) : request.status === 'in_progress' ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFD700]">🛠️ Maintenance Mode</p>
                  <h2 className="mt-1 text-xl font-black leading-tight text-[#EFE8D4]">Recovery under execution</h2>
                  <p className="text-xs text-[#A29A84] mt-1">Your vehicle service log is actively updating.</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFD700]">📍 Intercept Proximity</p>
                  <h2 className="mt-1 text-2xl font-black leading-none text-white font-mono">
                    {liveDistanceText ? liveDistanceText : 'Calculating...'}
                  </h2>
                  <p className="text-xs text-[#A29A84] mt-1.5">Live gap parameter spacing to your breakdown coordinate asset.</p>
                </>
              )}
            </div>
            <div className={`rounded-2xl p-3.5 ${request.status === 'pending' ? 'bg-[#FFD700]/10 text-[#FFD700] animate-spin duration-10000' : 'bg-white/5 text-white'}`}>
              <Clock3 size={24} />
            </div>
          </div>
        </div>

        {/* PROGRESS TIMELINE TRACKER FLOW */}
        <Card className="rounded-[1.75rem] border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Rescue Operation Progress Pipeline</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {workflowStages.map((stage, idx) => {
              const isPast = idx < currentStageIndex
              const isCurrent = idx === currentStageIndex
              return (
                <div 
                  key={stage.key} 
                  className={`rounded-xl p-2.5 border text-center transition-all ${
                    isCurrent 
                      ? 'border-[#F5D108] bg-amber-50/40 ring-1 ring-[#F5D108]/20' 
                      : isPast 
                        ? 'border-slate-200 bg-slate-50 opacity-60'
                        : 'border-slate-100 bg-slate-50/40 opacity-40'
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    {isPast ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <span className={`text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ${isCurrent ? 'bg-slate-900 text-[#F5D108]' : 'bg-slate-200 text-slate-600'}`}>
                        {stage.step}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-tight ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
                    {stage.label}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>

        {/* COMMS & RESPONDER IDENTITY CARD */}
        {mechanic && isActiveDispatch && (
          <Card className="rounded-[1.75rem] border-slate-200 bg-white p-0 overflow-hidden shadow-sm">
            <div className="p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-900">Verified Responder Attached</span>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-[#F5D108]">
                  {mechanic?.full_name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'RR'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-900">{mechanic?.full_name || 'Assigned Mechanic'}</p>
                  <p className="truncate text-xs text-slate-500">{workshopLabel || 'Certified recovery specialist'}</p>
                  <p className="mt-0.5 text-xs text-amber-500 font-mono">{stars} {ratingText}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <a
                  href={mechanic?.phone ? `tel:${mechanic.phone}` : undefined}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-[#F5D108] active:scale-95 transition-transform"
                >
                  <PhoneCall size={12} />
                  Voice Call
                </a>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="h-10 text-xs font-bold uppercase tracking-wider border border-slate-200 rounded-xl text-slate-500 hover:text-red-500 transition-colors"
                >
                  Flag Incident
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Responder Transit Vehicle</p>
                <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{request.vehicle?.model || request.service_type || 'Assistance Vehicle'}</p>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-black tracking-widest text-slate-900 font-mono">
                {request.vehicle_plate || 'DISPATCH'}
              </div>
            </div>
          </Card>
        )}

        {/* SIMPLIFIED THIRD-PARTY RIDE SUPPORT GATEWAY */}
        <Card className="rounded-[1.75rem] border-slate-200 bg-slate-50/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Alternative Commute Gateway</p>
          <p className="text-xs text-slate-600 mt-1 mb-3">Need to leave the site immediately? Launch an external transport operator dashboard:</p>
          <div className="grid grid-cols-3 gap-2">
            <a href="https://passenger.yango.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-white text-center text-[11px] font-bold transition-all hover:bg-slate-50 shadow-xs">
              <span className="flex items-center gap-1.5 text-[#EF4444]">
                <span className="h-3.5 w-3.5 rounded-sm bg-[#EF4444] flex items-center justify-center text-[8px] text-white font-black">Y</span>
                Yango
              </span>
            </a>
            <a href="https://bolt.eu" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-white text-center text-[11px] font-bold transition-all hover:bg-slate-50 shadow-xs">
              <span className="flex items-center gap-1 text-[#10B981]">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M13 2v9h8L11 22v-9H3l10-10z"/></svg>
                Bolt
              </span>
            </a>
            <a href="https://www.uber.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-white text-center text-[11px] font-bold transition-all hover:bg-slate-50 shadow-xs">
              <span className="flex items-center gap-1.5 text-black">
                <span className="h-3.5 w-3.5 rounded-full bg-black flex items-center justify-center text-[8px] text-white font-black">U</span>
                Uber
              </span>
            </a>
          </div>
        </Card>

        {/* INCIDENT DETAILS & MANAGEMENT CARD */}
        <Card className="rounded-[1.75rem] p-4 border-slate-200">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Incident Profile</p>
          <p className="mt-1.5 text-xs font-medium text-slate-700 leading-relaxed">{request.problem_description}</p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <MapPin size={12} className="text-[#F5D108] shrink-0" />
            <span className="truncate">{request.incident_address || 'Coordinates registered'}</span>
          </div>
          
          <div className="mt-4 space-y-2">
            {isCancellationAllowed && (
              <button
                type="button"
                onClick={handleCancelRequest}
                disabled={canceling}
                className="flex h-10 w-full items-center justify-center rounded-xl bg-red-50 text-xs font-bold uppercase tracking-wider text-red-600 border border-red-200/60 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {canceling ? 'Processing Cancellation...' : '❌ Cancel Rescue Request'}
              </button>
            )}
            <Link href="/dashboard/driver" className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-200 transition-colors">
              Exit Console
            </Link>
          </div>
        </Card>
      </div>

      {/* ==================================================================== */}
      {/* DESKTOP SIDE-BY-SIDE LARGE SCREEN INTERFACE GRID                    */}
      {/* ==================================================================== */}
      <div className="hidden grid-cols-1 gap-4 lg:grid lg:grid-cols-3">
        <div className="space-y-4">
          <Card className="border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dispatch Track ID</p>
              <Badge label={request.status} variant={request.status} dot />
            </div>
            <p className="mb-3 mt-1 text-[11px] text-slate-400 font-medium">Logged {timeAgo(request.created_at)}</p>
            
            {/* STYLIZED DESKTOP PROGRESS PIPELINE MODULE */}
            <div className="space-y-2.5 border-t border-slate-100 pt-3 mt-3">
              {workflowStages.map((stage, idx) => {
                const isPast = idx < currentStageIndex
                const isCurrent = idx === currentStageIndex
                return (
                  <div key={stage.key} className={`flex items-center gap-3 p-2 rounded-xl ${isCurrent ? 'bg-amber-50/40 border border-amber-200' : ''}`}>
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCurrent ? 'bg-slate-900 text-[#F5D108]' : isPast ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isPast ? '✓' : stage.step}
                    </div>
                    <span className={`text-xs font-bold ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>{stage.label}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* DESKTOP RESPONDER IDENTITY HOOK CARD */}
          {mechanic && isActiveDispatch && (
            <Card className="border-slate-900 bg-slate-950 text-white relative overflow-hidden">
              <div className="absolute top-3 right-3 text-white/5">
                <Shield size={32} />
              </div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned Operator Profiles</p>
              <div className="flex items-center gap-3">
                <Avatar name={mechanic.full_name} src={mechanic.avatar_url} online />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white truncate">{mechanic.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{workshopLabel || 'Certified recovery specialist'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2 mt-4 relative z-10">
                <a
                  href={mechanic?.phone ? `tel:${mechanic.phone}` : undefined}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-slate-100 transition-transform active:scale-95"
                >
                  <PhoneCall size={12} />
                  Call {mechanic?.phone || 'Emergency Line'}
                </a>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-xs text-slate-400 hover:text-red-400 font-medium underline underline-offset-4 text-center mt-1 transition-colors"
                >
                  Report
                </button>
              </div>
            </Card>
          )}

          {/* DESKTOP SUMMARY MANAGEMENT BOX */}
          <Card className="border-slate-200">
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Incident Details</p>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">{request.problem_description}</p>
            <p className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 font-medium flex items-center gap-1">
              📍 Address: <span className="text-slate-800 font-bold">{request.incident_address || 'Stored'}</span>
            </p>
            
            <div className="mt-4 space-y-2">
              {isCancellationAllowed && (
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  disabled={canceling}
                  className="w-full flex h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {canceling ? 'Processing Cancellation...' : 'Cancel Request'}
                </button>
              )}
              <Link href="/dashboard/driver" className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all">
                Return to Control Panel
              </Link>
            </div>
          </Card>

          {request.ai_diagnostic_result && (
            <DiagnosticResult diagnosis={request.ai_diagnostic_result} />
          )}
        </div>

        {/* MAP CONTENT HARNESS AREA */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rescue Status</p>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                {request.status === 'pending' 
                  ? 'Finding the nearest mechanic for you...' 
                  : request.status === 'accepted'
                    ? 'Mechanic accepted your request!'
                    : request.status === 'en_route'
                      ? `Mechanic is on the way (within ${liveDistanceText || 'a few km'})`
                      : request.status === 'arrived'
                        ? 'Mechanic is on site'
                        : request.status === 'in_progress'
                          ? 'Repair is in progress'
                          : 'Service completed'}
              </h3>
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 shadow-sm bg-white">
            <RescueMap
              request={request}
              driverLocation={request.incident_location}
              mechanicLocation={mechanicLocation}
              userRole="driver"
              height="480px"
            />
          </div>

          {/* DESKTOP ALTERNATIVE TRANSPORT ADVERTISER */}
          <Card className="rounded-[1.75rem] border-slate-200 bg-slate-50/50 p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Alternative Transit Routing Protocol</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900">Need alternative transportation?</p>
                <p className="mt-0.5 text-xs text-slate-500">Redirect instantly to third-party ride-hailing app dashboards to secure your commute.</p>
              </div>
              <div className="rounded-xl bg-slate-900 p-2 text-white shrink-0">
                <BusFront size={16} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="https://passenger.yango.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold transition-all hover:bg-slate-50 active:scale-95">
                <span className="flex items-center gap-1.5 text-[#EF4444]">
                  <span className="h-3.5 w-3.5 rounded-sm bg-[#EF4444] flex items-center justify-center text-[8px] text-white font-black">Y</span>
                  Yango Gateway
                </span>
                <ExternalLink size={12} className="text-slate-400" />
              </a>
              <a href="https://bolt.eu" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold transition-all hover:bg-slate-50 active:scale-95">
                <span className="flex items-center gap-1 text-[#10B981]">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M13 2v9h8L11 22v-9H3l10-10z"/></svg>
                  Bolt Gateway
                </span>
                <ExternalLink size={12} className="text-slate-400" />
              </a>
              <a href="https://www.uber.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold transition-all hover:bg-slate-50 active:scale-95">
                <span className="flex items-center gap-1.5 text-black">
                  <span className="h-3.5 w-3.5 rounded-full bg-black flex items-center justify-center text-[8px] text-white font-black">U</span>
                  Uber Gateway
                </span>
                <ExternalLink size={12} className="text-slate-400" />
              </a>
            </div>
          </Card>
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        requestId={id}
        reporterId={user?.id}
      />

      {/* CANCELLATION DIALOG MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200 relative">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Cancel Rescue Request?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please let us know if there is a reason for this cancellation. This helps us improve our dispatch matching.
            </p>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Reason</label>
              <textarea
                rows={3}
                placeholder="e.g. Vehicle started working, alternative help arrived..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-[#DDD0A8] p-3 text-xs bg-[#FFFBF7] text-[#1F1B10] focus:border-slate-900 focus:ring-slate-900"
              />
            </div>
            <div className="flex gap-2.5 justify-end">
              <button 
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Keep Request
              </button>
              <button 
                type="button"
                onClick={confirmCancelRequest}
                disabled={canceling}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {canceling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </PageWrapper>
  )
}