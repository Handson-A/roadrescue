'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { 
  Bell, CarFront, ClipboardList, Radar, ShieldCheck, 
  Users, Wrench, ChevronDown, ChevronUp, Radio, Network 
} from 'lucide-react'

import AdminEscalation from '@/components/admin/AdminEscalation'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import PageWrapper from '@/components/layout/PageWrapper'
import { useAuth } from '@/hooks/useAuth'

const quickActions = [
  {
    href: '/dashboard/admin/reviews',
    label: 'Credential Verification',
    description: 'Moderate pending profile updates, field documentation, and registration edits.',
    icon: ShieldCheck,
  },
  {
    href: '/dashboard/admin/requests',
    label: 'Global Incidents Log',
    description: 'Inspect full active lifecycles, historic tickets, and route states.',
    icon: Radar,
  },
  {
    href: '/dashboard/admin/mechanics',
    label: 'Service Provider Roster',
    description: 'Review field service provider profiles before granting dispatch terminal permissions.',
    icon: Wrench,
  },
  {
    href: '/dashboard/admin/users',
    label: 'Identity Framework',
    description: 'Manage platform accounts, security permissions, and operational roles.',
    icon: Users,
  },
]

export default function AdminDashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentRequests, setRecentRequests] = useState([])
  const [pendingMechanics, setPendingMechanics] = useState([])
  const [escalationExpanded, setEscalationExpanded] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadAdminDashboard() {
      try {
        const [statsResponse, requestsResponse, mechanicsResponse] = await Promise.all([
          fetch('/api/admin/stats', { cache: 'no-store' }),
          fetch('/api/admin/requests?limit=3', { cache: 'no-store' }),
          fetch('/api/admin/mechanics?status=pending&limit=3', { cache: 'no-store' }),
        ])

        const statsPayload = await statsResponse.json()
        const requestsPayload = await requestsResponse.json()
        const mechanicsPayload = await mechanicsResponse.json()

        if (!mounted) return

        if (statsResponse.ok) setStats(statsPayload.stats || null)
        if (requestsResponse.ok) setRecentRequests(requestsPayload.requests || [])
        if (mechanicsResponse.ok) setPendingMechanics(mechanicsPayload.mechanics || [])
      } catch (err) {
        console.error('Failed to sync admin operation feeds:', err)
      }
    }

    loadAdminDashboard()
    // 24/7 Persistent Operational Polling
    const interval = setInterval(loadAdminDashboard, 10000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const dashboardStats = [
    { label: 'Active Incidents', value: String(stats?.activeRequests ?? 0), note: 'Live breakdown tickets in progress', icon: ClipboardList },
    { label: 'Deployed Mechanics', value: String(stats?.availableMechanics ?? 0), note: 'Verified & active in field pool', icon: CarFront },
    { label: 'Pending Clearances', value: String(stats?.pendingVerifications ?? 0), note: 'Awaiting credential validation reviews', icon: ShieldCheck },
  ]

  return (
    <PageWrapper
      title="Operations Command"
      description="Real-time control matrix for monitoring emergency dispatches, validating credentials, and managing platform scale."
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
        
        {/* ================= HIGH-LEVEL METRICS OVERVIEW ================= */}
        <section className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon

            return (
              <Card key={stat.label} className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                    <p className="mt-2 text-4xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{stat.note}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700 shadow-sm">
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                </div>
              </Card>
            )
          })}
        </section>

        {/* ================= LIVE ROUTING MONITOR & PERSISTENT STATUS ================= */}
        <section className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
          <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm p-0">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Global Dispatch Tracker Feed</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-slate-600 shadow-xs">Telemetry Node</span>
                <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[#FFD700]">24/7 Monitoring</span>
              </div>
            </div>

            {/* Dynamic request logging feeds */}
            <div className="divide-y divide-slate-100 border-b border-slate-100 max-h-48 overflow-y-auto">
              {recentRequests.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs font-medium text-slate-400">No active roadside incidents broadcasted across system sectors.</div>
              ) : (
                recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/40 transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-xs font-bold text-slate-900 truncate capitalize">{request.problem_description || `${request.service_type.replace('_', ' ')} breakdown`}</p>
                      <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                        {request.driver?.full_name || 'Anonymous Client'} • {request.incident_address || 'GPS Coordinates Flagged'}
                      </p>
                    </div>
                    <Badge label={request.status} variant={request.status} />
                  </div>
                ))
              )}
            </div>

            {/* Simulated Live Satellite Navigation Sandbox Canvas Frame */}
            <div className="p-4 bg-slate-50/40">
              <div className="h-80 rounded-xl border border-slate-200/80 bg-[radial-gradient(circle_at_50%_40%,rgba(245,209,8,0.06),transparent_50%)] relative flex flex-col items-center justify-center p-6 text-center overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
                <div className="relative z-10 space-y-2">
                  <div className="mx-auto h-11 w-11 rounded-xl bg-slate-900 flex items-center justify-center text-[#FFD700] border border-slate-800 shadow shadow-[#FFD700]/10">
                    <Network size={20} className="animate-spin duration-3000" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">Operational Grid Mapping Sandbox</h4>
                  <p className="text-[11px] font-medium text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Continuous pipeline active. System map streams automated asset positions and ongoing responder target trajectories in real time.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* RIGHT COLUMNS: VERIFICATION TRAFFIC & ARCHITECTURAL BALANCES */}
          <div className="space-y-4">
            <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Verification Vectors</span>
              <h3 className="text-sm font-extrabold text-slate-800 mt-3">Identity Hub Backlog</h3>
              <p className="mt-1 text-4xl font-black text-slate-900 tracking-tight">{pendingMechanics.length}</p>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Mechanics awaiting application clearances</p>
              <Link
                href="/dashboard/admin/mechanics"
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                Open Identification Matrix
              </Link>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Platform Parameters</span>
              <h3 className="text-sm font-extrabold text-slate-800 mt-3">Active System Infrastructure</h3>
              <div className="mt-3.5 space-y-2 text-xs font-semibold">
                <p className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 text-slate-700">
                  <span>Total System Orders</span> 
                  <span className="text-slate-900 font-bold">{stats?.totalRequests ?? 0}</span>
                </p>
                <p className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 text-slate-700">
                  <span>Live Dispatches</span> 
                  <span className="text-slate-900 font-bold">{stats?.activeRequests ?? 0}</span>
                </p>
                <p className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 text-slate-700">
                  <span>Registered Identities</span> 
                  <span className="text-slate-900 font-bold">{stats?.totalUsers ?? 0}</span>
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* ================= GRID QUICK ACTIONS GRID ================= */}
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <Link key={action.href} href={action.href} className="group">
                <Card className="h-full rounded-2xl border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:-translate-y-0.5">
                  <div className="flex flex-col h-full justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Task Router</span>
                      <h3 className="text-base font-black text-slate-900 tracking-tight group-hover:text-slate-800 transition-colors">{action.label}</h3>
                      <p className="text-xs text-slate-400 font-medium leading-normal pt-1">{action.description}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2 text-slate-600 shadow-xs self-start group-hover:bg-[#FFD700] group-hover:text-slate-900 transition-all">
                      <Icon size={16} strokeWidth={2.2} />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </section>

        {/* ================= ESCALATION GATEWAY (FIXED INTERACTIVE VARIABLE SETTER) ================= */}
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/30 overflow-hidden shadow-xs">
          <button 
            onClick={() => setEscalationExpanded(!escalationExpanded)}
            className="w-full flex items-center justify-between p-5 text-left bg-white border-b border-slate-100 focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200/60">
                <Radio size={16} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">Admin Control Parameters</h4>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Expand to manage structural account authority and security access vector promotions.</p>
              </div>
            </div>
            <div className="text-slate-400 pr-1">
              {escalationExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          
          {escalationExpanded && (
            <div className="p-6 bg-white/40 animate-in fade-in slide-in-from-top-2 duration-200">
              <AdminEscalation />
            </div>
          )}
        </div>

        {/* ================= IDENTIFIED SESSION FOOTER ================= */}
        {profile?.role === 'admin' && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-500 shadow-xs">
            <Radio size={14} className="text-emerald-500 animate-pulse" />
            <span>Terminal Connected: Authenticated Session Node — </span>
            <span className="font-bold text-slate-800">{profile?.full_name || 'System Administrator'}</span>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}