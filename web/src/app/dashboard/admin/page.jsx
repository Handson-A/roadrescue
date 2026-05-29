'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Bell, CarFront, ClipboardList, Radar, ShieldCheck, Users, Wrench } from 'lucide-react'

import AdminEscalation from '@/components/admin/AdminEscalation'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import PageWrapper from '@/components/layout/PageWrapper'
import { useAuth } from '@/hooks/useAuth'

const quickActions = [
  {
    href: '/dashboard/admin/reviews',
    label: 'Review pending edits',
    description: 'Approve or reject driver and mechanic field changes. ',
    icon: ShieldCheck,
  },
  {
    href: '/dashboard/admin/requests',
    label: 'All rescue requests',
    description: 'Inspect lifecycle states and active rescue activity.',
    icon: Radar,
  },
  {
    href: '/dashboard/admin/mechanics',
    label: 'Review mechanics',
    description: 'Approve or reject mechanic profiles before they enter dispatch.',
    icon: Wrench,
  },
  {
    href: '/dashboard/admin/users',
    label: 'Manage users',
    description: 'Track accounts, roles, and platform activity.',
    icon: Users,
  },
]

export default function AdminDashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentRequests, setRecentRequests] = useState([])
  const [pendingMechanics, setPendingMechanics] = useState([])

  useEffect(() => {
    let mounted = true

    async function loadAdminDashboard() {
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
    }

    loadAdminDashboard()
    return () => {
      mounted = false
    }
  }, [])

  const dashboardStats = [
    { label: 'Active breakdowns', value: String(stats?.activeRequests ?? 0), note: 'Live from rescue_requests', icon: ClipboardList },
    { label: 'Available mechanics', value: String(stats?.availableMechanics ?? 0), note: 'Verified + online pool', icon: CarFront },
    { label: 'Pending verifications', value: String(stats?.pendingVerifications ?? 0), note: 'Fetched from mechanic_profiles', icon: ShieldCheck },
  ]

  return (
    <PageWrapper
      title="Admin dashboard"
      description="Command-deck overview for request monitoring, mechanic verification, and platform operations."
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon

            return (
              <Card key={stat.label} className="rounded-2xl border-[#7C7767]/25 bg-[#F3F4F6] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7C7767]">{stat.label}</p>
                    <p className="mt-2 text-4xl font-black text-[#111827]">{stat.value}</p>
                    <p className="mt-1 text-xs font-semibold text-[#7C7767]">{stat.note}</p>
                  </div>
                  <div className="rounded-2xl border border-[#7C7767]/25 bg-[#111827] p-3 text-[#FFD700]">
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                </div>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
          <Card className="overflow-hidden rounded-2xl border-[#7C7767]/25 bg-[#F3F4F6] p-0">
            <div className="flex items-center justify-between border-b border-[#7C7767]/25 bg-[#111827] px-4 py-3 text-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#F3F4F6]">Live dispatch feed</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-lg bg-[#F3F4F6] px-2 py-1 text-[#111827]">Satellite</span>
                <span className="rounded-lg bg-[#FFD700] px-2 py-1 text-[#111827]">Live feed</span>
              </div>
            </div>

            <div className="divide-y divide-[#7C7767]/20">
              {recentRequests.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#7C7767]">No recent requests yet.</div>
              ) : (
                recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{request.problem_description}</p>
                      <p className="text-xs text-[#7C7767]">{request.driver?.full_name || 'Unknown driver'} · {request.incident_address || 'Location pending'}</p>
                    </div>
                    <span className="rounded-md bg-[#111827] px-2 py-1 text-[10px] font-semibold text-[#FFD700]">{request.status}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4">
              <div className="h-88 rounded-xl border border-[#7C7767]/25 bg-[radial-gradient(circle_at_30%_35%,rgba(255,215,0,0.15),transparent_45%),linear-gradient(160deg,#111827_0%,#1f2937_38%,#111827_100%)]" />
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-2xl border-[#7C7767]/25 bg-[#F3F4F6] p-5">
              <h3 className="text-sm font-bold text-[#111827]">Verification queue</h3>
              <p className="mt-2 text-3xl font-black text-[#111827]">{pendingMechanics.length}</p>
              <p className="text-sm text-[#7C7767]">Pending mechanics</p>
              <Link
                href="/dashboard/admin/mechanics"
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#111827] px-4 text-sm font-semibold text-[#F3F4F6]"
              >
                Open identity hub
              </Link>
            </Card>

            <Card className="rounded-2xl border-[#7C7767]/25 bg-[#F3F4F6] p-5">
              <h3 className="text-sm font-bold text-[#111827]">Systems online</h3>
              <div className="mt-3 space-y-2 text-sm">
                <p className="rounded-lg border border-[#7C7767]/25 bg-[#111827] px-3 py-2 text-[#F3F4F6]">Requests: {stats?.totalRequests ?? 0}</p>
                <p className="rounded-lg border border-[#7C7767]/25 bg-[#111827] px-3 py-2 text-[#F3F4F6]">Active: {stats?.activeRequests ?? 0}</p>
                <p className="rounded-lg border border-[#7C7767]/25 bg-[#111827] px-3 py-2 text-[#F3F4F6]">Users: {stats?.totalUsers ?? 0}</p>
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <Link key={action.href} href={action.href}>
                <Card className="h-full rounded-2xl border-[#7C7767]/25 bg-[#F3F4F6] transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[#7C7767]">Quick action</p>
                      <h3 className="mt-3 text-xl font-black text-[#111827]">{action.label}</h3>
                      <p className="mt-2 text-sm text-[#7C7767]">{action.description}</p>
                    </div>
                    <div className="rounded-2xl border border-[#7C7767]/25 bg-[#111827] p-3 text-[#FFD700]">
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </section>

        <div className="mt-2">
          <AdminEscalation />
        </div>

        {profile?.role === 'admin' && (
          <div className="flex items-center gap-2 rounded-xl border border-[#D7CCAD] bg-white px-4 py-3 text-sm text-[#6E634B]">
            <Bell size={16} className="text-[#6A5A10]" />
            Signed in as {profile.full_name || 'Admin'}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
