'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic' // FIXED: Added Next.js standard lazy router
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { BarChart3, TrendingUp, Clock, Users, Star, MapPin, Wrench } from 'lucide-react'

// Dynamic Import: Disables server side instantiation rendering to prevent leaflet window crashes
const LiveHotspotsMap = dynamic(
  () => import('@/components/admin/LiveHotspotsMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[26rem] flex items-center justify-center bg-slate-50 border rounded-xl">
        <Spinner />
      </div>
    )
  }
)

export default function AdminReportsPage() {
  // ... rest of your AdminReportsPage component code remains exactly identical
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(7) // 7 days or 30 days toggle switch wrapper
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadLiveSystemAnalytics() {
      try {
        setLoading(true)
        
        // Connect to your secure server-side API endpoint
        const response = await fetch('/api/admin/stats')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to retrieve system operational reports')
        }

        if (mounted) {
          setStats(result.stats)
        }
      } catch (err) {
        console.error('[REPORTS PAGE SYNC FAULT]:', err)
        toast.error(err.message || 'Error pulling live data panels')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadLiveSystemAnalytics()
    return () => { mounted = false }
  }, [timeRange])

  if (loading || !stats) {
    return (
      <PageWrapper title="Operational Analytics">
        <div className="flex justify-center py-24"><Spinner /></div>
      </PageWrapper>
    )
  }

  // Safely compute percentage breakdown metrics from database categories arrays
  const totalIncidents = stats.totalRequests || 0
  const findCountByService = (type) => stats.serviceTypeBreakdown?.find(s => s.service_type === type)?.count || 0

  const categoriesPercentages = {
    engine: totalIncidents > 0 ? Math.round((findCountByService('engine_repair') / totalIncidents) * 100) : 0,
    tire: totalIncidents > 0 ? Math.round((findCountByService('flat_tire') / totalIncidents) * 100) : 0,
    electrical: totalIncidents > 0 ? Math.round((findCountByService('battery_jump') / totalIncidents) * 100) : 0,
    other: totalIncidents > 0 ? Math.round((findCountByService('other') / totalIncidents) * 100) : 0,
  }

  // Aggregate global cumulative fault calculations
  const totalMechanicalPercentage = Math.min(categoriesPercentages.engine + categoriesPercentages.other, 100)

  return (
    <PageWrapper 
      title="Incident Analytics" 
      description="Real-time operational distribution logs, diagnostic fault scales, and network performance indicators."
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
        
        {/* ================= HIGH LEVEL ANALYTICS SUMMARY GRID ================= */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Incidents Logged</span>
              <BarChart3 size={16} className="text-slate-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{stats.totalRequests}</p>
            <p className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp size={12} /> +{stats.activeRequests} actively on-going
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Avg Dispatch Response</span>
              <Clock size={16} className="text-slate-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{stats.avgResponseTime || '0'}m</p>
            <p className="mt-1 text-xs font-medium text-slate-400">From creation ticket to mechanic match</p>
          </Card>

          <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Operators</span>
              <Users size={16} className="text-slate-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{stats.activeMechanics}</p>
            <p className="mt-1 text-xs font-bold text-emerald-600">Mechanics toggled live on-duty</p>
          </Card>

          <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System CSAT Score</span>
              <Star size={16} className="text-[#FFD700] fill-[#FFD700]" />
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{stats.avgRating || '5.0'} <span className="text-sm font-bold text-slate-400">/ 5.0</span></p>
            <p className="mt-1 text-xs font-bold text-amber-600 tracking-wider">Verified transaction reviews</p>
          </Card>
        </div>

        {/* ================= MAP VISUALIZER & DIAGNOSTIC MATRIX ================= */}
        <div className="grid gap-6 lg:grid-cols-[1.9fr_0.9fr]">
          <Card className="rounded-2xl border border-slate-100 bg-white p-0 overflow-hidden shadow-sm">
  <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex justify-between items-center">
    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
      <MapPin size={14} className="text-slate-400" /> Regional Breakdown Hotspots Map
    </h3>
    <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider">Live System Sync</span>
  </div>
  <div className="p-4 bg-slate-50/20">
    {/* Interactive Node Deployment Layer Map */}
    <LiveHotspotsMap mechanics={stats.activeMechanicLocations} />
  </div>
</Card>

          {/* REAL FAULT DISTRIBUTION SUMMARY PANEL */}
          <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-5">
                <Wrench size={14} /> Diagnostic Breakdown
              </h3>
              
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-center">
                <p className="text-4xl font-black text-slate-900 tracking-tight">{totalMechanicalPercentage}%</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Mechanical Incidents Ratio</p>
              </div>

              {/* Dynamic CSS Bar charts powered by live state calculations */}
              <div className="mt-6 space-y-4 text-xs font-semibold text-slate-700">
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Engine Diagnostics</span><span className="text-slate-900">{categoriesPercentages.engine}%</span></div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#FFD700] h-full rounded-full transition-all duration-500" style={{ width: `${categoriesPercentages.engine}%` }} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Tire Maintenance</span><span className="text-slate-900">{categoriesPercentages.tire}%</span></div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-700 h-full rounded-full transition-all duration-500" style={{ width: `${categoriesPercentages.tire}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between"><span>Electrical / Battery</span><span className="text-slate-900">{categoriesPercentages.electrical}%</span></div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-400 h-full rounded-full transition-all duration-500" style={{ width: `${categoriesPercentages.electrical}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between"><span>Other Callouts</span><span className="text-slate-900">{categoriesPercentages.other}%</span></div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-200 h-full rounded-full transition-all duration-500" style={{ width: `${categoriesPercentages.other}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ================= STATE FACTOR BAR VISUALIZER CHANNELS ================= */}
        <div className="w-full">
          <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Operational Distribution Load</h3>
                <p className="text-xs text-slate-400 mt-0.5">Live tracking counts grouped by active workflow nodes</p>
              </div>
              <div className="flex gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                <button 
                  onClick={() => setTimeRange(7)} 
                  className={`rounded-lg px-3 py-1 border transition-all ${timeRange === 7 ? 'bg-[#FFD700] border-[#FFD700] text-slate-900 font-extrabold shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}
                >
                  7 Days View
                </button>
                <button 
                  onClick={() => setTimeRange(30)} 
                  className={`rounded-lg px-3 py-1 border transition-all ${timeRange === 30 ? 'bg-[#FFD700] border-[#FFD700] text-slate-900 font-extrabold shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}
                >
                  30 Days View
                </button>
              </div>
            </div>

            <div className="min-h-[14rem] rounded-xl border border-slate-100 bg-slate-50/50 p-6 flex flex-col justify-center gap-4 relative">
              {(!stats.statusBreakdown || stats.statusBreakdown.length === 0) ? (
                <div className="text-center text-xs font-medium text-slate-400 py-12">No active lifecycle transitions logged in current database matrix.</div>
              ) : (
                stats.statusBreakdown.map((item) => {
                  const barPercentage = totalVolume > 0 ? Math.min(Math.round((item.count / totalVolume) * 100), 100) : 5;
                  return (
                    <div key={item.status} className="w-full flex items-center gap-4 text-xs font-bold">
                      <span className="w-24 text-slate-500 font-mono uppercase text-[10px] tracking-wider text-left">{item.status}</span>
                      <div className="flex-1 bg-slate-100 h-5 rounded-md overflow-hidden relative shadow-inner">
                        <div 
                          className="bg-slate-900 h-full rounded-md transition-all duration-700 ease-out flex items-center justify-end px-2"
                          style={{ width: `${barPercentage}%` }}
                        >
                          {barPercentage > 10 && <span className="text-[10px] font-black text-white">{barPercentage}%</span>}
                        </div>
                      </div>
                      <span className="w-12 text-right text-slate-900 font-black">{item.count} open</span>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>

      </div>
    </PageWrapper>
  )
}