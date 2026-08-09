'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { BarChart3, TrendingUp, Clock, Users, Star, Wrench, Download, ShieldCheck } from 'lucide-react'
import { BRAND_COLORS } from '@/lib/theme'

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(7) 
  const [stats, setStats] = useState(null)

  const handleExportReport = () => {
    try {
      if (!stats) {
        toast.error('No analytics data available for export')
        return
      }

      let csvContent = "data:text/csv;charset=utf-8,"
      csvContent += "RoadRescue Operations Summary Report 2026\n"
      csvContent += `Generated At,${new Date().toISOString()}\n\n`
      
      csvContent += "Core Metrics,Value\n"
      csvContent += `Total Incidents Logged,${stats.totalRequests || 0}\n`
      csvContent += `Actively Ongoing,${stats.activeRequests || 0}\n`
      csvContent += `Avg Dispatch Response Time (min),${stats.avgResponseTime || 0}\n`
      csvContent += `Active Operators On-Duty,${stats.activeMechanics || 0}\n`
      csvContent += `System CSAT Rating,${stats.avgRating || 5.0}\n\n`

      if (stats.statusBreakdown && stats.statusBreakdown.length > 0) {
        csvContent += "Status Distribution,Count\n"
        stats.statusBreakdown.forEach(item => {
          csvContent += `${item.status.toUpperCase()},${item.count || 0}\n`
        })
        csvContent += "\n"
      }

      if (stats.serviceTypeBreakdown && stats.serviceTypeBreakdown.length > 0) {
        csvContent += "Service Callout Category,Count\n"
        stats.serviceTypeBreakdown.forEach(item => {
          csvContent += `${item.service_type.toUpperCase()},${item.count || 0}\n`
        })
      }

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `roadrescue_ops_report_2026.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Operations summary exported successfully!')
    } catch (err) {
      console.error('[EXPORT FAULT]:', err)
      toast.error('Failed to export operational statistics')
    }
  }

  useEffect(() => {
    let mounted = true

    async function loadLiveSystemAnalytics() {
      try {
        setLoading(true)
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

  const totalIncidents = stats.totalRequests || 0
  const findCountByService = (type) => stats.serviceTypeBreakdown?.find(s => s.service_type === type)?.count || 0

  const categoriesPercentages = {
    engine: totalIncidents > 0 ? Math.round((findCountByService('engine_repair') / totalIncidents) * 100) : 0,
    tire: totalIncidents > 0 ? Math.round((findCountByService('flat_tire') / totalIncidents) * 100) : 0,
    electrical: totalIncidents > 0 ? Math.round((findCountByService('battery_jump') / totalIncidents) * 100) : 0,
    other: totalIncidents > 0 ? Math.round((findCountByService('other') / totalIncidents) * 100) : 0,
  }

  const totalMechanicalPercentage = Math.min(categoriesPercentages.engine + categoriesPercentages.other, 100)
  const totalVolume = stats.statusBreakdown?.reduce((sum, item) => sum + (item.count || 0), 0) || 0

  const getNormalizedServiceLabel = (type) => {
    const lower = type?.toLowerCase() || ''
    if (lower.includes('repair')) return 'General Repair'
    if (lower.includes('tow')) return 'Towing & Recovery'
    if (lower.includes('tyre') || lower.includes('tire')) return 'Tyre Change'
    if (lower.includes('battery') || lower.includes('jump')) return 'Battery Jump'
    if (lower.includes('fuel')) return 'Fuel Delivery'
    return 'Other Assistance'
  }

  const aggregatedServices = {}
  stats.serviceTypeBreakdown?.forEach(item => {
    const label = getNormalizedServiceLabel(item.service_type)
    aggregatedServices[label] = (aggregatedServices[label] || 0) + item.count
  })
  
  const allLabels = ['General Repair', 'Towing & Recovery', 'Tyre Change', 'Battery Jump', 'Fuel Delivery', 'Other Assistance']
  const colorPalette = [
    BRAND_COLORS.primary, // Gold / Brand matching
    '#334155', // Slate-700
    '#3b82f6', // Blue-500
    '#10b981', // Emerald-500
    '#f43f5e', // Rose-500
    '#94a3b8'  // Slate-400
  ]

  const chartData = allLabels.map((label, idx) => ({
    label,
    count: aggregatedServices[label] || 0,
    color: colorPalette[idx]
  })).filter(d => d.count > 0) // Filter categories with 0 data to build clean segments

  const totalChartCount = chartData.reduce((sum, d) => sum + d.count, 0)

  // Math config parameters for SVG Donut calculation
  const RADIUS = 70
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  let accumulatedPercent = 0

  return (
    <PageWrapper 
      title="Operational Analytics" 
      description="Real-time operational distribution logs, diagnostic fault scales, and network performance indicators."
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
        
        {/* ================= ACTIONS TOOLBAR ================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">System Live Feeds Connected</span>
          </div>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 transition active:scale-95 shadow-sm cursor-pointer"
          >
            <Download size={14} /> Export Operations Summary
          </button>
        </div>

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
              <Star size={16} className="text-primary fill-primary" />
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{stats.avgRating || '5.0'} <span className="text-sm font-bold text-slate-400">/ 5.0</span></p>
            <p className="mt-1 text-xs font-bold text-amber-600 tracking-wider">Verified transaction reviews</p>
          </Card>
        </div>

        {/* ================= DONUT VISUALIZER & DIAGNOSTIC MATRIX ================= */}
        <div className="grid gap-6 lg:grid-cols-[1.9fr_0.9fr]">
          <Card className="rounded-2xl border border-slate-100 bg-white p-0 overflow-hidden shadow-sm flex flex-col justify-between">
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BarChart3 size={14} className="text-slate-400" /> Incident Categories Distribution
              </h3>
              <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider">Live System Sync</span>
            </div>
            
            <div className="p-6 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 min-h-[24rem]">
              {totalChartCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-xs font-medium text-slate-400 py-12">
                  No active incidents recorded across service type categories.
                </div>
              ) : (
                <>
                  {/* SVG PURE DONUT COMPONENT CONTAINER */}
                  <div className="relative w-48 h-48 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                      {/* Underlay tracking ring base */}
                      <circle
                        cx="100"
                        cy="100"
                        r={RADIUS}
                        className="stroke-slate-100"
                        strokeWidth="20"
                        fill="transparent"
                      />
                      {/* Compound Segment Loop */}
                      {chartData.map((segment, index) => {
                        const percent = (segment.count / totalChartCount) * 100
                        const strokeLength = (percent / 100) * CIRCUMFERENCE
                        const strokeOffset = CIRCUMFERENCE - strokeLength + (accumulatedPercent / 100) * CIRCUMFERENCE
                        
                        // Push stacking threshold over to next calculation step
                        accumulatedPercent -= percent

                        return (
                          <circle
                            key={index}
                            cx="100"
                            cy="100"
                            r={RADIUS}
                            fill="transparent"
                            stroke={segment.color}
                            strokeWidth="22"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap={chartData.length === 1 ? 'butt' : 'round'}
                            className="transition-all duration-700 ease-in-out hover:brightness-95 cursor-pointer"
                          />
                        )
                      })}
                    </svg>

                    {/* Center Context Meta Node */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">{totalChartCount}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Total Cases</span>
                    </div>
                  </div>

                  {/* CUSTOM LABELED SIDE LEGEND BLOCK */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 w-full">
                    {chartData.map((item, idx) => {
                      const sharePercent = Math.round((item.count / totalChartCount) * 100)
                      return (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-50 bg-slate-50/30">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="h-3 w-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-extrabold text-slate-700 truncate">{item.label}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 pl-2">
                            <span className="text-xs font-black text-slate-900 font-mono">{item.count}</span>
                            <span className="text-[10px] text-slate-400 font-bold">({sharePercent}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
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

              <div className="mt-6 space-y-4 text-xs font-semibold text-slate-700">
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Engine Diagnostics</span><span className="text-slate-900">{categoriesPercentages.engine}%</span></div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${categoriesPercentages.engine}%` }} />
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

        {/* ================= STATE FACTOR BAR VISUALIZER & COMPLIANCE PIPELINES ================= */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] w-full">
          {/* Operational Distribution Load */}
          <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Operational Distribution Load</h3>
                <p className="text-xs text-slate-400 mt-0.5">Live tracking counts grouped by active workflow nodes</p>
              </div>
              <div className="flex gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                <button 
                  onClick={() => setTimeRange(7)} 
                  className={`rounded-lg px-3 py-1 border transition-all ${timeRange === 7 ? 'bg-primary border-primary text-slate-900 font-extrabold shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}
                >
                  7 Days View
                </button>
                <button 
                  onClick={() => setTimeRange(30)} 
                  className={`rounded-lg px-3 py-1 border transition-all ${timeRange === 30 ? 'bg-primary border-primary text-slate-900 font-extrabold shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}
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
                  const barPercentage = totalVolume > 0 ? Math.min(Math.round((item.count / totalVolume) * 100), 100) : 5
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

          {/* Regulatory Compliance Pipelines */}
          <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Regulatory Compliance Pipelines</h3>
                <p className="text-xs text-slate-400 mt-0.5">Upcoming integration gateways for national transport agencies</p>
              </div>

              <div className="space-y-4">
                {/* DVLA Integration */}
                <div className="relative rounded-xl border border-slate-100 bg-slate-50/50 p-4 overflow-hidden">
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded shadow-sm">
                      Compliance Lock
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600 h-fit">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">DVLA Verification Gateway</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Automated real-time vehicle validation mapping license plate and chassis numbers against the national Driver and Vehicle Licensing Authority registry.
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        API Endpoint: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-500">/api/compliance/dvla/verify</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NSRA Integration */}
                <div className="relative rounded-xl border border-slate-100 bg-slate-50/50 p-4 overflow-hidden">
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded shadow-sm">
                      Future Pipeline
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500 h-fit">
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">NSRA Accident Analytics</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Direct transmission of anonymous operational breakdown incident logs to the National Road Safety Authority portal for traffic and safety studies.
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        Webhook Destination: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-500">nsra-portal.gov.gh/ingest</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </PageWrapper>
  )
}