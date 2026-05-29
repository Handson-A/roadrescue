'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BatteryCharging, CarFront, Fuel, PhoneCall, Search, Wrench } from 'lucide-react'

import PageWrapper from '@/components/layout/PageWrapper'
import RequestForm from '@/components/request/RequestForm'
import RequestStatusBadge from '@/components/request/RequestStatusBadge'
import RescueMap from '@/components/map/RescueMap'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'

export default function DriverDashboard() {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    let mounted = true

    async function loadRequests() {
      const supabase = createClient()
      const { data } = await supabase
        .from('rescue_requests')
        .select('id, status, service_type, problem_description, incident_address, created_at, accepted_at')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)

      if (mounted) {
        setRequests(data || [])
        setLoading(false)
      }
    }

    loadRequests()

    return () => {
      mounted = false
    }
  }, [user?.id])

  const activeRequest = requests.find((request) => !['completed', 'cancelled'].includes(request.status))

  const progressByStatus = {
    pending: 20,
    bidding: 35,
    accepted: 55,
    en_route: 75,
    arrived: 92,
    in_progress: 92,
    completed: 100,
    resolved: 100,
    cancelled: 100,
  }

  const progress = progressByStatus[activeRequest?.status] || 20
  const quickTiles = [
    { label: 'Vehicle Info', value: profile?.vehicle_name || 'Add your vehicle', href: '/dashboard/driver/account', icon: CarFront },
    { label: 'Find Fuel/EV', value: 'Nearby stations', href: '/dashboard/driver', icon: Fuel },
  ]

  const recentItems = requests.slice(0, 2)

  return (
    <PageWrapper title="Driver dashboard" description="Create a rescue request and track it through every dispatch stage in a single emergency-focused board.">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="lg:hidden">
          <div className="overflow-hidden rounded-4xl border border-[#7C7767]/30 bg-[#F3F4F6] shadow-[0_20px_40px_rgba(17,24,39,0.06)]">
            <div className="flex items-center justify-between border-b border-[#7C7767]/25 bg-[#F3F4F6] px-4 py-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#111827] text-[#FFD700]" />
              <span className="text-2xl font-black tracking-tight text-[#111827]">RoadRescue</span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#111827] text-[#FFD700]">
                <PhoneCall size={16} />
              </span>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div className="rounded-[1.2rem] border border-[#7C7767]/25 bg-[#F3F4F6] px-3 py-2 text-[11px] font-semibold tracking-[0.16em] text-[#7C7767]">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#FFD700] align-middle mr-2" />
                Active Membership <span className="float-right">ID: {profile?.membership_id || profile?.id || '—'}</span>
              </div>

              <div className="rounded-[1.6rem] bg-[#111827] px-4 py-4 text-[#F3F4F6] shadow-[0_16px_30px_rgba(17,24,39,0.22)]">
                <p className="text-sm font-semibold">Hello, {profile?.full_name?.split(' ')?.[0] || 'Driver'}</p>
                <h1 className="mt-1 text-2xl font-black leading-tight">Need Help Now?</h1>
                <p className="mt-1 text-sm text-[#7C7767]">Quick Diagnosis &amp; Rescue Dispatch</p>
                <Link
                  href="/dashboard/driver/request/new"
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] px-4 text-sm font-semibold text-[#111827]"
                >
                  Request Assistance
                  <Search size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {quickTiles.map((tile) => {
                  const Icon = tile.icon

                  return (
                    <Link key={tile.label} href={tile.href} className="rounded-[1.2rem] border border-[#7C7767]/25 bg-[#F3F4F6] p-3 shadow-[0_8px_18px_rgba(17,24,39,0.04)]">
                      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#111827] text-[#FFD700]">
                        <Icon size={16} />
                      </div>
                      <p className="text-sm font-bold text-[#111827]">{tile.label}</p>
                      <p className="mt-1 text-xs text-[#7C7767]">{tile.value}</p>
                    </Link>
                  )
                })}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-base font-black text-[#111827]">Recent Activity</h2>
                  <Link href="/dashboard/driver/history" className="text-sm font-semibold text-[#111827]">View All</Link>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div className="rounded-[1.2rem] border border-[#7C7767]/25 bg-[#F3F4F6] px-4 py-5 text-sm text-[#7C7767]">Loading recent activity...</div>
                  ) : recentItems.length === 0 ? (
                    <div className="rounded-[1.2rem] border border-[#7C7767]/25 bg-[#F3F4F6] px-4 py-5 text-sm text-[#7C7767]">No recent rescue requests yet.</div>
                  ) : (
                    recentItems.map((request) => (
                      <Link key={request.id} href={`/dashboard/driver/request/${request.id}`} className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-[#7C7767]/25 bg-[#F3F4F6] px-4 py-3.5 shadow-[0_8px_18px_rgba(17,24,39,0.04)]">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#111827]">{request.service_type}</p>
                          <p className="truncate text-xs text-[#7C7767]">{timeAgo(request.created_at)} · {request.incident_address || 'Location pending'}</p>
                        </div>
                        <RequestStatusBadge status={request.status} />
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.4rem] border border-[#7C7767]/25 bg-[#111827] shadow-[0_16px_30px_rgba(17,24,39,0.12)]">
                <div className="relative h-36 bg-linear-to-br from-[#111827] via-[#1f2937] to-[#111827]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,215,0,0.28),transparent_22%),linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0.08)_100%)]" />
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between text-white">
                    <span className="rounded-full border border-[#7C7767]/30 bg-[#F3F4F6]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F3F4F6]">Roadside Status</span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FFD700] text-[#111827]">⚠</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-4 text-center text-white">
                    <p className="text-sm font-semibold">Safety First</p>
                    <p className="mt-1 text-xs text-[#7C7767]">Keep essentials ready and stay visible roadside.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {activeRequest && (
          <div className="hidden border-t-4 border-t-[#FFD700] bg-[#111827] p-5 text-[#F3F4F6] lg:block">
            <span className="rounded-full bg-[#FFD700] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#111827]">Live Status: {activeRequest.status}</span>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-mono text-xl font-black text-[#FFD700]">Emergency Ticket {activeRequest.id}</h2>
                <p className="mt-1 text-xs text-[#7C7767]">{activeRequest.problem_description}</p>
              </div>
              <p className="max-w-md text-xs font-mono text-[#7C7767]">{activeRequest.incident_address || 'Location pending'}</p>
            </div>
          </div>
        )}

        <div className="hidden bg-[#F3F4F6] p-4 lg:block">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider text-[#7C7767]">
            <span>1. Match Search</span>
            <span>2. Bid Accepted</span>
            <span>3. En Route</span>
            <span>4. On Site</span>
            <span>5. Cleared</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#7C7767]/25">
            <div className="h-full rounded-full bg-[#FFD700] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="hidden gap-6 lg:grid lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-[#7C7767]/25 bg-[#111827] px-5 py-4 text-[#F3F4F6]">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#FFD700]">Request Support</p>
                <h3 className="mt-2 text-2xl font-black">Dispatch Roadside Help</h3>
              </div>
              <div className="p-4 lg:p-6">
                <RequestForm />
              </div>
            </Card>

            <div className="relative overflow-hidden bg-[#F3F4F6] p-0">
              <RescueMap request={activeRequest} height="370px" />
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <Card className="bg-[#F3F4F6]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#7C7767]">Current status</p>
              {loading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : activeRequest ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <RequestStatusBadge status={activeRequest.status} />
                    <span className="text-xs text-[#7C7767]">{timeAgo(activeRequest.created_at)}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#111827]">{activeRequest.service_type}</p>
                  <p className="text-sm text-[#7C7767]">{activeRequest.incident_address || 'Location pending'}</p>
                  <Link href={`/dashboard/driver/request/${activeRequest.id}`} className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#111827] px-4 text-xs font-black uppercase tracking-wider text-[#F3F4F6] hover:opacity-90">
                    Open Live Tracking
                  </Link>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#7C7767]">No active rescue request. Create one to start dispatch.</p>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#7C7767]">Recent history</p>
                  <h3 className="mt-1 text-sm font-black">Latest requests</h3>
                </div>
                <Link href="/dashboard/driver/history" className="text-xs font-bold uppercase tracking-wider text-[#111827]">View all</Link>
              </div>
              <div className="mt-4 space-y-3">
                {loading ? (
                  <div className="flex justify-center py-6"><Spinner /></div>
                ) : requests.length === 0 ? (
                  <p className="py-6 text-sm text-[#7C7767]">No requests yet.</p>
                ) : (
                  requests.map((request) => (
                    <Link key={request.id} href={`/dashboard/driver/request/${request.id}`} className="block rounded-xl border border-[#7C7767]/25 bg-[#F3F4F6] p-3 transition hover:shadow-soft">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#111827]">{request.service_type}</p>
                          <p className="mt-1 truncate text-xs text-[#7C7767]">{request.problem_description}</p>
                        </div>
                        <RequestStatusBadge status={request.status} />
                      </div>
                      <p className="mt-2 text-[11px] text-[#7C7767]">{request.incident_address || 'Address pending'} · {timeAgo(request.created_at)}</p>
                    </Link>
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