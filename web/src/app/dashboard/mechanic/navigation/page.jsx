'use client'

import { useState, useEffect } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import RescueMap from '@/components/map/RescueMap'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Navigation, Radio, MapPin, Phone, User, Compass } from 'lucide-react'

export default function MechanicNavigationPage() {
  const { user } = useAuth()
  const [activeJob, setActiveJob] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let mounted = true

    async function loadActiveRoute() {
      const supabase = createClient()
      
      const { data } = await supabase
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
        .maybeSingle()

      if (mounted) {
        setActiveJob(data || null)
        setLoading(false)
      }
    }

    loadActiveRoute()
    
    // Poll every 5 seconds to keep coordinates highly accurate while driving
    const interval = setInterval(loadActiveRoute, 5000)
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [user?.id])

  return (
    <PageWrapper 
      title="Route Guidance" 
      description="Turn-by-turn navigation mapping, live incident coordinates, and citizen distress scene tracking."
    >
      <div className="mx-auto max-w-4xl space-y-5 pb-12">
        
        {/* ================= MAP INTERFACE CONTAINER ================= */}
        <Card className="p-0 overflow-hidden rounded-2xl border-slate-200 shadow-sm bg-white">
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass size={14} className={activeJob ? 'animate-spin' : ''} />
              {activeJob ? 'Live Vector Matrix' : 'Navigation Grid Standby'}
            </span>
            {activeJob && (
              <Badge label={activeJob.status} variant={activeJob.status} dot />
            )}
          </div>

          {loading ? (
            <div className="h-[50vh] flex items-center justify-center bg-slate-50/40">
              <Spinner />
            </div>
          ) : activeJob ? (
            <RescueMap request={activeJob} height="50vh" />
          ) : (
            /* Premium layout placeholder when no active job coordinates are ready */
            <div className="h-[50vh] bg-slate-50/40 flex flex-col items-center justify-center p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3.5 border border-slate-200/60 shadow-sm">
                <Radio size={20} className="text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Active Target Routes Mapped</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 font-medium leading-relaxed">
                Accept an incoming breakdown request on the dashboard console to automatically initialize live turn-by-turn navigation streams.
              </p>
            </div>
          )}
        </Card>

        {/* ================= STEP ROUTE GUIDANCE METADATA BOX ================= */}
        <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Navigation size={14} className="text-slate-400" /> 
            {activeJob ? 'Active Route Parameters' : 'Navigation System Status'}
          </h3>

          {activeJob ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 border-t border-slate-50 pt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <User size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Distressed Driver</span>
                    <p className="text-sm font-bold text-slate-900 truncate">{activeJob.driver?.full_name || 'Anonymous Driver'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Incident Destination Target</span>
                    <p className="text-sm font-medium text-slate-600 line-clamp-2">{activeJob.incident_address || 'Coordinates set'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex flex-col justify-between sm:items-end">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Reported Issue</span>
                  <p className="text-sm font-bold text-slate-900 capitalize">{activeJob.service_type.replace('_', ' ')}</p>
                </div>

                {activeJob.driver?.phone && (
                  <a
                    href={`tel:${activeJob.driver.phone}`}
                    className="inline-flex h-9 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 transition-colors"
                  >
                    <Phone size={13} />
                    <span>Contact Driver</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm font-medium text-slate-400 border-t border-slate-50 pt-3">
              Awaiting dispatch assignment telemetry vectors...
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  )
}