'use client'

import { useState, useEffect, useRef } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import RescueMap from '@/components/map/RescueMap'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useMechanicStatus } from '@/hooks/useMechanicStatus'
import { useBroadcastLocation } from '@/hooks/useMechanicLocation'
import { 
  Navigation, 
  Radio, 
  MapPin, 
  Phone, 
  User, 
  Compass, 
  AlertCircle, 
  CheckCircle,
  ShieldCheck,
  Wrench
} from 'lucide-react'

export default function MechanicNavigationPage() {
  const { user } = useAuth()
  const [activeJob, setActiveJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const userIdRef = useRef(user?.id)

  // 1. Monitor availability and location status maps
  const { isAvailable, localCoords } = useMechanicStatus(user?.id)

  // 2. Initialize active real-time channel location broadcasting
  const { broadcastError } = useBroadcastLocation(activeJob?.id, user?.id)

  // Poll for incoming active assignments or states
  useEffect(() => {
    userIdRef.current = user?.id
    if (!userIdRef.current) return
    let mounted = true

    async function loadActiveRoute() {
      const currentUserId = userIdRef.current
      if (!currentUserId) return

      const supabase = createClient()
      
      const { data } = await supabase
        .from('rescue_requests')
        .select(`
          id,
          status,
          service_type,
          problem_description,
          incident_address,
          incident_location,
          created_at,
          driver:driver_id (id, full_name, phone)
        `)
        .eq('mechanic_id', currentUserId)
        .in('status', ['accepted', 'en_route', 'arrived', 'in_progress'])
        .maybeSingle()

      if (mounted && userIdRef.current) {
        setActiveJob(data || null)
        setLoading(false)
      }
    }

    loadActiveRoute()
    const interval = setInterval(loadActiveRoute, 5000)
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [user?.id])

  const quickUpdateStatus = async (newStatus) => {
    if (!activeJob) return
    setUpdating(true)
    const response = await fetch('/api/requests/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: activeJob.id, newStatus }),
    })

    const result = await response.json()
    if (response.ok && result.request) {
      setActiveJob(result.request)
    } else {
      alert(result.error || 'Unable to sync navigation step')
    }
    setUpdating(false)
  }

  return (
    <PageWrapper 
      title="Route Guidance Hub" 
      description="Turn-by-turn navigation mapping, live incident coordinates, and citizen distress scene tracking."
    >
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        
        {/* ================= MAP INTERFACE CONTAINER ================= */}
        <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
          <div className="border-b border-slate-100 bg-slate-50/90 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={16} className={`text-slate-500 ${activeJob ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                {activeJob ? 'Live Satellite Navigation Array' : isAvailable ? 'Standby Telemetry Scanning (Online)' : 'Core Terminal Grid Standby (Offline)'}
              </span>
            </div>
            {activeJob && (
              <Badge label={activeJob.status?.replace('_', ' ')} variant={activeJob.status} dot />
            )}
          </div>

          {loading ? (
            <div className="h-[55vh] flex items-center justify-center bg-slate-50/30">
              <Spinner />
            </div>
          ) : activeJob || isAvailable ? (
            <div className="w-full h-[55vh] relative overflow-hidden z-10">
              <RescueMap 
                request={activeJob} 
                mechanicLocation={localCoords} 
                userRole="mechanic"
                isOnline={isAvailable}
                height="100%" 
              />
              
              {/* Floating Quick Action Overlay inside Navigation Panel */}
              {activeJob && (
                <div className="absolute bottom-4 left-4 right-4 z-20 md:left-auto md:right-4 md:w-80 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 shadow-lg">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Quick Action Execution</span>
                  <div className="flex flex-col gap-2">
                    {activeJob.status === 'accepted' && (
                      <Button onClick={() => quickUpdateStatus('en_route')} disabled={updating} className="w-full text-xs uppercase tracking-wider py-2 font-bold" variant="secondary">
                        {updating ? 'Processing...' : 'Mark En Route'}
                      </Button>
                    )}
                    {activeJob.status === 'en_route' && (
                      <Button onClick={() => quickUpdateStatus('arrived')} disabled={updating} className="w-full text-xs uppercase tracking-wider py-2 font-bold" variant="secondary">
                        {updating ? 'Processing...' : 'Signal Arrival'}
                      </Button>
                    )}
                    {activeJob.status === 'arrived' && (
                      <Button onClick={() => quickUpdateStatus('in_progress')} disabled={updating} className="w-full text-xs uppercase tracking-wider py-2 font-bold" variant="secondary">
                        {updating ? 'Processing...' : 'Commence Work'}
                      </Button>
                    )}
                    {activeJob.status === 'in_progress' && (
                      <Button onClick={() => quickUpdateStatus('completed')} disabled={updating} className="w-full text-xs uppercase tracking-wider py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                        {updating ? 'Processing...' : 'Finalize Job'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[50vh] bg-gradient-to-b from-slate-50/50 to-slate-100/40 flex flex-col items-center justify-center p-6 text-center">
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-slate-400 mb-4 border border-slate-200 shadow-sm">
                <Radio size={24} className="text-slate-400 animate-pulse" />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Navigation Core Offline</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1.5 font-medium leading-relaxed">
                Toggle your duty dispatch matrix to <strong className="text-slate-600">Online</strong> to activate the mapping grids.
              </p>
            </div>
          )}
        </Card>

        {/* ================= STEP ROUTE GUIDANCE METADATA BOX ================= */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Navigation size={16} className="text-slate-400" /> 
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              {activeJob ? 'Active Route Parameters' : 'Core Diagnostics Feed'}
            </h3>
          </div>

          {activeJob ? (
            <div className="grid gap-6 md:grid-cols-3 items-center">
              
              {/* Parameter 1: Motorist Data */}
              <div className="space-y-3 border-r border-slate-100 pr-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mt-0.5">
                    <User size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Distressed Driver</span>
                    <p className="text-sm font-bold text-slate-900 truncate">{activeJob.driver?.full_name || 'Anonymous User'}</p>
                    {activeJob.driver?.phone && <p className="text-xs text-slate-400 mt-0.5">{activeJob.driver.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Parameter 2: Address Vector */}
              <div className="space-y-3 md:border-r md:border-slate-100 md:px-2">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mt-0.5">
                    <MapPin size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Target Vector Coordinates</span>
                    <p className="text-xs font-semibold text-slate-600 line-clamp-2 mt-0.5">{activeJob.incident_address || 'GPS Coordinates Flagged'}</p>
                  </div>
                </div>
              </div>

              {/* Parameter 3: Communications and Breakdown details */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-between items-start md:items-end md:pl-4">
                <div className="text-left md:text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Incident Vectors</span>
                  <div className="flex items-center gap-1.5 mt-0.5 md:justify-end">
                    <Wrench size={13} className="text-slate-400" />
                    <p className="text-sm font-bold text-slate-900 capitalize">{activeJob.service_type?.replace('_', ' ')}</p>
                  </div>
                </div>

                {activeJob.driver?.phone && (
                  <a
                    href={`tel:${activeJob.driver.phone}`}
                    className="inline-flex h-9 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 transition-colors"
                  >
                    <Phone size={13} />
                    <span>Open Phone Communication</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {isAvailable ? (
                <>
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <ShieldCheck size={14} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    Radar matrix tracking initialized successfully. Standing by for unassigned corridor breakdown vectors...
                  </p>
                </>
              ) : (
                <>
                  <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <AlertCircle size={14} />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    System dormant. Tap the &quot;Go Online&quot; buttton to activate.
                  </p>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  )
}