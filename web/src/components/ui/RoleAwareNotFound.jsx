'use client'

import Link from 'next/link'
import { ArrowLeft, Home, Search } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const roleRoutes = {
  driver: '/dashboard/driver',
  mechanic: '/dashboard/mechanic',
  admin: '/dashboard/admin',
}

export default function RoleAwareNotFound() {
  const { role } = useAuth()
  const dashboardHref = roleRoutes[role] || '/auth/login'
  const dashboardLabel = role ? `${role.charAt(0).toUpperCase()}${role.slice(1)} dashboard` : 'Sign in'

  return (
    <div className="min-h-screen bg-[#FFF9EF] px-4 py-6 text-[#1F1B10]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-4xl border border-[#D0C6AB] bg-white shadow-[0_20px_60px_rgba(31,27,16,0.08)] lg:flex-row">
        <div className="relative flex flex-1 items-end overflow-hidden bg-[#1F1B10] px-6 py-8 text-white lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,215,0,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(255,215,0,0.08),transparent_24%)]" />
          <div className="relative z-10 max-w-md">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFD700]">
              RoadRescue
            </span>
            <h1 className="mt-4 text-5xl font-black leading-none lg:text-7xl">404</h1>
            <p className="mt-4 text-base leading-7 text-white/80 lg:text-lg">
              The route you're looking for doesn't exist. We'll get you back to the right screen.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F5D108] px-5 text-sm font-black text-[#1F1B10]"
              >
                <Home size={16} /> Go home
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-bold text-white"
              >
                <ArrowLeft size={16} /> Sign in
              </Link>
            </div>
          </div>

          <div className="absolute -right-8 -bottom-8 h-44 w-44 rounded-full border border-white/10 bg-white/5 blur-0" />
        </div>

        <div className="flex flex-1 flex-col justify-between bg-[#FFF9EF] px-6 py-8 lg:px-10 lg:py-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D0C6AB] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6F654D]">
              <Search size={12} />
              Route unavailable
            </div>

            <h2 className="mt-5 text-3xl font-black text-[#1F1B10]">Check the address or return to your dashboard.</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-[#4D4732]">
              If you followed a link, it may have moved or been removed. Use your dashboard to continue your rescue workflow.
            </p>

            <div className="mt-8 grid gap-3">
              <Link
                href={dashboardHref}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1F1B10] px-5 text-sm font-bold text-white"
              >
                {dashboardLabel}
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-[#D0C6AB] bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#1F1B10]">Need help?</p>
            <p className="mt-2 text-sm leading-6 text-[#6E634B]">
              Use the sign-in flow to reach the correct role screen.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}