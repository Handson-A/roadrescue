'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CarFront, Fuel, Wrench, Search } from 'lucide-react'

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
  const vehicleLabel = [profile?.vehicle_make, profile?.vehicle_model].filter(Boolean).join(' ') || 'Link vehicle profile'
  const membershipId = profile?.vehicle_plate || profile?.id?.substring(0, 8) || '—'
  const quickTiles = [
    { label: 'Vehicle Info', value: vehicleLabel, href: '/dashboard/driver/account', icon: CarFront },
    { label: 'Find Fuel/EV', value: 'Locate refueling grids', href: '/dashboard/driver', icon: Fuel },
  ]

  const recentItems = requests.slice(0, 2)

  return (
    // FIXED: Added lg:pl-64 to clear the desktop/tablet sidebar frame area cleanly
    <div className="w-full min-h-screen bg-[#FFF8EA] text-[#1F1B10] p-4 sm:p-6 lg:pl-64 flex justify-center items-start pb-24 lg:pb-8">
      <div className="w-full max-w-2xl flex flex-col gap-5">
        
        {/* ==================================================================== */}
        {/* APP INFRASTRUCTURE MODULES (Unified Content Column)                  */}
        {/* ==================================================================== */}
        
        {/* Subtitle Directive Card Block */}
        <div className="rounded-2xl border border-[#DCCDA9] bg-[#FFF9EF] p-4 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-[#1F1B10]">Dashboard</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#7C6B44]">
           Request emergency vehicle assistance and monitor your technician&#39;s arrival coordinates in real time.
          </p>
        </div>

        {/* Active Membership Identifier Pill */}
        <div className="rounded-xl border border-[#DCCDA9] bg-white px-4 py-2.5 text-xs font-bold tracking-wider text-[#7C6B44] flex justify-between items-center shadow-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#F5D108] animate-pulse" />
            Active Membership
          </span>
          <span className="font-mono text-[11px] text-slate-500">ID: {membershipId}</span>
        </div>

        {/* Core CTA Action Portal Layer */}
        <div className="rounded-2xl bg-[#1F1B10] p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wrench size={80} />
          </div>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Hello, {profile?.full_name?.split(' ')?.[0] || 'Driver'}</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight">Need Help Now?</h3>
          <p className="mt-1 text-xs text-white/60">Get connected to nearby certified mechanics with live dispatch tracking.</p>
          <Link
            href="/dashboard/driver/request/new"
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F5D108] text-sm font-black uppercase tracking-wider text-[#1F1B10] shadow-md active:scale-98 transition"
          >
            REQUEST ROADSIDE RESCUE
            <Search size={14} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Quick Info Parameter Action Grid */}
        <div className="grid grid-cols-2 gap-3">
          {quickTiles.map((tile) => {
            const Icon = tile.icon
            return (
              <Link key={tile.label} href={tile.href} className="rounded-2xl border border-[#DCCDA9] bg-white p-4 shadow-sm active:bg-slate-50 transition flex flex-col justify-between">
                <div>
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF9EF] border border-[#DCCDA9] text-[#7C6B44]">
                    <Icon size={16} />
                  </div>
                  <p className="text-sm font-black text-[#1F1B10]">{tile.label}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500 font-medium truncate">{tile.value}</p>
              </Link>
            )
          })}
        </div>

        {/* Live Active Incident Ticket Tracker Panel */}
        {activeRequest && (
          <div className="space-y-3">
            <div className="border-l-4 border-l-[#F5D108] bg-[#1F1B10] p-4 text-white rounded-r-2xl shadow-sm">
              <span className="rounded-md bg-[#F5D108] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#1F1B10]">
                Live Dispatch Unit: {activeRequest.status}
              </span>
              <div className="mt-3 space-y-1">
                <h4 className="font-mono text-base font-black text-amber-400">Emergency Node #{activeRequest.id?.substring(0,8)}</h4>
                <p className="text-xs text-white/70 leading-relaxed">{activeRequest.problem_description}</p>
                <p className="text-[11px] font-mono text-white/40 pt-1">📍 {activeRequest.incident_address || 'Location coordinates active'}</p>
              </div>
            </div>

            {/* Transit Tracking Progress Bar */}
            <div className="bg-white border border-[#DCCDA9] p-4 rounded-2xl shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-wider text-slate-400">
                <span>1. Matching</span>
                <span>2. Accepted</span>
                <span>3. En Route</span>
                <span>4. Cleared</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#F5D108] transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Embedded Live Map Viewport */}
            <div className="relative overflow-hidden border border-[#DCCDA9] rounded-2xl h-64 shadow-sm">
              <RescueMap request={activeRequest} height="100%" />
            </div>
          </div>
        )}

        {/* Recent Activity Logs Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#7C6B44]">Recent Incident Logs</h4>
            <Link href="/dashboard/driver/history" className="text-xs font-bold text-amber-700 hover:underline">View All</Link>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#DCCDA9] bg-white p-5 text-xs font-medium text-slate-400 text-center animate-pulse">Loading activity logs...</div>
          ) : recentItems.length === 0 ? (
            <div className="rounded-2xl border border-[#DCCDA9] bg-white p-5 text-xs font-medium text-slate-400 text-center">No active roadside requests logged.</div>
          ) : (
            recentItems.map((request) => (
              <Link key={request.id} href={`/dashboard/driver/request/${request.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-[#DCCDA9] bg-white p-4 shadow-sm active:bg-slate-50 transition">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-[#1F1B10] capitalize">{request.service_type?.replace('_', ' ')}</p>
                  <p className="truncate text-xs text-slate-400 mt-0.5">{timeAgo(request.created_at)} · {request.incident_address || 'Accra Central'}</p>
                </div>
                <RequestStatusBadge status={request.status} />
              </Link>
            ))
          )}
        </div>

        {/* Safety Directive Guidelines Footer Layer */}
        <div className="rounded-2xl border border-[#DCCDA9] bg-[#1F1B10] p-4 text-white shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400">Emergency Safety Protocol</span>
            <span className="text-xs">⚠️</span>
          </div>
          <div className="pt-3 text-center">
            <p className="text-xs text-white/80 font-medium">
              Activate hazard indicators immediately. Disembark the vehicle toward the safety shoulder, clear of active transit lanes, and wear high-visibility gear.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}