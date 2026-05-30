'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, Bell, CircleHelp, LogOut, Menu, Search, Settings, ShieldCheck, Volume2, VolumeX } from 'lucide-react'

import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { signOut } from '@/lib/auth'
import { timeAgo, truncate } from '@/lib/utils'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  
  const pathname = usePathname()
  const hrs = new Date().getHours()
  const greeting = hrs < 12 ? 'Good morning' : hrs < 17 ? 'Good afternoon' : 'Good evening'
  const router = useRouter()
  const { profile } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(profile?.id)
  
  const role = profile?.role || 'driver'
  const roleBase = `/dashboard/${role}`
  const isDashboardRoot = pathname === roleBase || pathname === `${roleBase}/`
  const firstName = profile?.full_name?.split(' ')?.[0] || 'Member'

  const activeRescueCount = notifications.filter((n) => !n.is_read).length

  async function handleSignOut() {
    await signOut()
    window.location.href = '/auth/login'
  }

  const handleProfileClick = () => {
    router.push(`/dashboard/${role}/account`)
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push(roleBase)
  }

  // Dynamic role-based label computation instead of hardcoded panels
  const getRoleLabel = () => {
    if (role === 'admin') return 'Admin Portal'
    if (role === 'mechanic') return 'Mechanic Console'
    return 'Driver Panel'
  }

  const getMobileTitle = () => {
    if (isDashboardRoot) return `${getRoleLabel()}`
    if (pathname.includes('/request/')) return 'Live tracking'
    if (pathname.includes('/activity')) return 'Activity Log'
    if (pathname.includes('/history')) return 'Job History'
    if (pathname.includes('/account')) return 'My Profile'
    if (pathname.includes('/settings')) return 'System Settings'
    if (pathname.includes('/reports')) return 'Incident Reports'
    if (pathname.includes('/mechanics')) return 'Verified Mechanics'
    if (pathname.includes('/requests')) return 'Active Dispatch'

    return `${getRoleLabel()}`
  }

  const mobileSubtitle = isDashboardRoot
    ? 'System online & ready'
    : pathname.includes('/request/')
      ? 'Track responder deployment coordinates'
      : pathname.includes('/account')
        ? `${profile?.full_name || 'Secure account session'}`
        : 'Secure RoadRescue session'

  return (
    // Fixed: Wrapper is now transparent on mobile so it doesn't leave a ghost white bar above your dark banner
    <header className="sticky top-0 z-40 md:border-b md:border-slate-200 md:bg-white/95 md:backdrop-blur-xl">
      
      {/* ==================================================================== */}
      {/* MOBILE HEADER DISPLAY GRID (Visible exclusively on mobile screens)    */}
      {/* ==================================================================== */}
      <div className="md:hidden border-b border-[#3A3428] bg-[#2A261C] text-[#EFE8D4]">
        {isDashboardRoot ? (
          <div className="px-4 pb-5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-[#7C7767]">{greeting}.</p>
                <h1 className="mt-1 truncate font-black text-2xl text-[#FFD700]">{firstName}</h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpen((prev) => !prev)}
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#3A3428] bg-white/5 text-[#EFE8D4] shadow-md"
                  aria-label="Open notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#FFD700]" />}
                </button>

                <button
                  onClick={handleProfileClick}
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[#FFD700]/30 bg-[#FFD700] text-[#111827] shadow-md"
                  aria-label="Open profile"
                >
                  <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} size="sm" />
                </button>
              </div>
            </div>

            <form
              className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-2.5 border border-white/10"
              onSubmit={(event) => event.preventDefault()}
            >
              <Search size={16} className="shrink-0 text-[#7C7767]" />
              <input
                type="search"
                placeholder={role === 'mechanic' ? "Search service logs..." : "Search locations or garages..."}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#EFE8D4] placeholder:text-[#7C7767] outline-none"
              />
              <button
                type="submit"
                className="flex h-8 items-center justify-center rounded-xl bg-[#FFD700] px-4 text-xs font-black uppercase tracking-wider text-[#111827]"
              >
                Go
              </button>
            </form>

            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7C7767]">
                Active Terminal
              </span>
              <span className="rounded-full bg-[#FFD700]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#FFD700]">
                {activeRescueCount} alerts
              </span>
            </div>
          </div>
        ) : (
          <div className="relative px-4 pb-4 pt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EFE8D4] text-[#2A261C] shadow-md"
                aria-label="Go back"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="inline-flex max-w-full items-center rounded-full bg-[#3A3428] px-3.5 py-1.5 border border-white/5">
                  <span className="truncate text-xs font-black uppercase tracking-wider text-[#FFD700]">{getMobileTitle()}</span>
                </div>
                <p className="mt-1.5 truncate text-xs text-[#7C7767] font-medium">{mobileSubtitle}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpen((prev) => !prev)}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-[#EFE8D4]"
                  aria-label="Open notifications"
                >
                  <Bell size={17} />
                  {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#FFD700]" />}
                </button>

                <button
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3A3428] text-[#EFE8D4]"
                  aria-label="Open menu"
                >
                  <Menu size={18} />
                </button>
              </div>
            </div>

            {mobileMenuOpen && (
              <div className="absolute right-4 top-16 z-50 w-52 overflow-hidden rounded-2xl border border-[#3A3428] bg-[#2A261C] p-1.5 shadow-xl">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleProfileClick()
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-bold text-[#EFE8D4] hover:bg-white/5"
                >
                  <span>My Profile</span>
                  <ShieldCheck size={14} className="text-emerald-400" />
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-bold text-red-400 hover:bg-red-950/30"
                >
                  <span>Sign Out</span>
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* DESKTOP HEADER DISPLAY GRID (Hidden completely on mobile viewports) */}
      {/* ==================================================================== */}
      <div className="hidden items-center justify-between gap-4 border-b border-[#D8CCAE] bg-[#F5F0E2] px-4 py-3 md:flex lg:px-6">
        <div className="min-w-0 flex items-center gap-4">
          <h1 className="truncate text-3xl font-black text-[#6A5A10] tracking-tight">RoadRescue</h1>
          <span className="rounded-full border border-[#C8BC9E] bg-[#EFE6D1] px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#6F654D]">
            {role === 'admin' ? 'Operations' : role === 'mechanic' ? 'Field Service' : 'Client System'}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <div className="hidden w-full max-w-md items-center gap-2 rounded-xl border border-[#D7CCAD] bg-[#EFE6D1] px-3 py-2 lg:flex">
            <Search size={16} className="text-[#7A7058]" />
            <input
              type="search"
              placeholder={role === 'admin' ? 'Search incidents, plates, or mechanics...' : 'Search requests, drivers, or locations...'}
              className="w-full bg-transparent text-sm text-[#3C3527] outline-none placeholder:text-[#8A8066]"
            />
          </div>

          <button
            onClick={() => setAudioEnabled((prev) => !prev)}
            className={`rounded-xl border p-2 transition ${audioEnabled ? 'border-[#C8BC9E] bg-[#EDE2CA] text-[#6A5A10]' : 'border-[#D7CCAD] bg-[#F8F4EA] text-[#7A7058]'}`}
            title={audioEnabled ? 'Mute alerts' : 'Unmute alerts'}
          >
            {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <div className="relative">
            <button onClick={() => setOpen((prev) => !prev)} className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#D7CCAD] bg-[#F8F4EA] text-[#3B3528] shadow-sm">
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-[#DCCDA9] bg-white shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-[#E0D5B7] bg-[#FFF9EF] px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">Notifications</p>
                    <p className="text-[11px] text-slate-500">Live dispatch updates</p>
                  </div>
                  {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs font-bold text-amber-600 hover:underline">Mark all read</button>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-slate-400 font-medium">No active alerts recorded</div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-[#FFF9EF] ${notification.is_read ? 'opacity-60' : 'bg-amber-50/40'}`}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-slate-900">{notification.title || 'Dispatch Update'}</p>
                          <Badge label={notification.type} variant={notification.type} />
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{truncate(notification.message, 90)}</p>
                        <p className="mt-2 text-[10px] font-medium text-slate-400">{timeAgo(notification.created_at)}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="hidden h-11 w-11 items-center justify-center rounded-xl border border-[#D7CCAD] bg-[#F8F4EA] text-[#5A513C] lg:inline-flex">
            <Settings size={17} />
          </button>

          <button
            onClick={handleProfileClick}
            className="hidden items-center gap-2 rounded-xl border border-[#D7CCAD] bg-[#F8F4EA] px-3 py-1.5 transition hover:bg-[#EFE6D1] sm:flex"
          >
            <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} online />
            <div className="leading-tight text-left">
              <p className="text-xs font-black text-[#2D271C]">{profile?.full_name || 'Rescue Driver'}</p>
              <p className="text-[10px] text-[#6E634B] font-medium">{profile?.email || 'user@roadrescue.gh'}</p>
            </div>
          </button>

          <button
            onClick={handleSignOut}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-black uppercase tracking-wider text-red-700 transition hover:bg-red-100"
          >
            <LogOut size={14} />
            <span>Exit</span>
          </button>
        </div>
      </div>

    </header>
  )
}