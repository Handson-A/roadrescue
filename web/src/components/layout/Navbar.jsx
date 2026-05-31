'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, Bell, CircleHelp, LogOut, Menu, Search, ShieldCheck, Volume2, VolumeX, X } from 'lucide-react'
import Link from 'next/link'

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
  const notificationRef = useRef(null)

  const pathname = usePathname()
  const hrs = new Date().getHours()
  const greeting = hrs < 12 ? 'Good morning' : hrs < 17 ? 'Good afternoon' : 'Good evening'
  const router = useRouter()
  
  // Destructure BOTH user (Supabase Auth Core) and profile (Public Database Row Table)
  const { user, profile } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, getNotificationHref } = useNotifications(profile?.id)

  useEffect(() => {
    function handlePointerDown(event) {
      if (!notificationRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
  
  const role = profile?.role || 'driver'
  const roleBase = `/dashboard/${role}`
  const isDashboardRoot = pathname === roleBase || pathname === `${roleBase}/`
  const firstName = profile?.full_name?.split(' ')?.[0] || 'member'

  const activeRescueCount = notifications.filter((n) => !n.is_read).length

  async function handleSignOut() {
    await signOut()
    router.replace('/auth/login')
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

  // Safety Extraction Check: Prioritize live database field string, fallback directly onto active login context parameters
  const authenticatedEmail = profile?.email || user?.email || 'authenticated@roadrescue.gh'

  return (
    <header className="sticky top-0 z-40 md:border-b md:border-slate-200 md:bg-white/95 md:backdrop-blur-xl">
      
      {/* ==================================================================== */}
      {/* MODERNIZED MOBILE HEADER DISPLAY GRID                               */}
      {/* ==================================================================== */}
      <div className="md:hidden bg-[#1E1B15] text-[#EFE8D4] shadow-lg transition-all duration-300">
        {isDashboardRoot ? (
          <div className="px-5 pb-6 pt-5">
            {/* Top row: Greeting & Profile/Notification Toggles */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-[#FFD700]">{greeting}, {firstName}</h1>
                <p className="text-[11px] font-medium text-[#A29A84] truncate mt-0.5 opacity-85">
                  {authenticatedEmail}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setOpen((prev) => !prev)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#EFE8D4] border border-white/10 active:scale-95 transition-transform"
                  aria-label="Open notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#FFD700] ring-4 ring-[#1E1B15]" />
                  )}
                </button>

                <button
                  onClick={handleProfileClick}
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#FFD700] active:scale-95 transition-transform shadow-md shadow-[#FFD700]/10"
                  aria-label="Open profile"
                >
                  <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} size="sm" />
                </button>
              </div>
            </div>

            {/* Premium, sleek Search form input */}
            <form
              className="mt-5 flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3.5 py-2 border border-white/[0.08] focus-within:border-[#FFD700]/40 focus-within:bg-white/[0.06] transition-all duration-200"
              onSubmit={(event) => event.preventDefault()}
            >
              <Search size={16} className="shrink-0 text-[#A29A84]" />
              <input
                type="search"
                placeholder={role === 'mechanic' ? "Search service logs..." : "Search locations or garages..."}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#EFE8D4] placeholder:text-[#6C6552] outline-none"
              />
              <button
                type="submit"
                className="flex h-7 items-center justify-center rounded-lg bg-[#FFD700] px-3.5 text-xs font-bold uppercase tracking-wider text-[#1E1B15] active:scale-95 transition-transform"
              >
                Go
              </button>
            </form>

          </div>
        ) : (
          /* Sub-route / Inner Page Header context */
          <div className="relative px-5 py-4 flex items-center justify-between gap-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={handleBack}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFE8D4] text-[#1E1B15] shadow-sm active:scale-95 transition-transform"
                aria-label="Go back"
              >
                <ArrowLeft size={16} strokeWidth={2.5} />
              </button>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700] block">{getMobileTitle()}</span>
                <p className="mt-0.5 truncate text-xs text-[#A29A84] font-medium">{mobileSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen((prev) => !prev)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#EFE8D4] border border-white/10"
                aria-label="Open notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#FFD700]" />}
              </button>

              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#EFE8D4] border border-white/10"
                aria-label="Open menu"
              >
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>

            {/* Mobile Context Dropdown menu */}
            {mobileMenuOpen && (
              <div className="absolute right-5 top-[60px] z-50 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#26221A] p-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleProfileClick()
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#EFE8D4] hover:bg-white/5"
                >
                  <span>My Profile</span>
                  <ShieldCheck size={14} className="text-emerald-400" />
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-500/10"
                >
                  <span>Sign Out</span>
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Universal Mobile Notification Pull-down Layer */}
        {open && (
          <div className="border-t border-white/[0.06] bg-[#1A1813] max-h-72 overflow-y-auto animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
              <span className="text-xs font-bold text-[#A29A84]">Active Updates ({unreadCount})</span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[11px] font-bold text-[#FFD700] hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-[#6C6552]">No new dispatch feeds</div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={getNotificationHref(n, profile?.role) || '#'}
                  onClick={async (e) => {
                    if (!getNotificationHref(n, profile?.role)) e.preventDefault()
                    await markAsRead(n.id)
                    setOpen(false)
                  }}
                  className={`block px-5 py-3 border-b border-white/[0.02] active:bg-white/[0.02] ${n.is_read ? 'opacity-40' : 'bg-[#FFD700]/[0.02]'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#EFE8D4] truncate">{n.title || 'Update'}</p>
                    <Badge label={n.type} variant={n.type} />
                  </div>
                  <p className="mt-0.5 text-xs text-[#A29A84] line-clamp-2">{n.message}</p>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* DESKTOP HEADER DISPLAY GRID                                         */}
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

          <div ref={notificationRef} className="relative">
            <button type="button" onClick={() => setOpen((prev) => !prev)} className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#D7CCAD] bg-[#F8F4EA] text-[#3B3528] shadow-sm">
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
                      <Link
                        key={notification.id}
                        href={getNotificationHref(notification, profile?.role) || '#'}
                        aria-disabled={!getNotificationHref(notification, profile?.role)}
                        onClick={async (event) => {
                          const href = getNotificationHref(notification, profile?.role)
                          if (!href) {
                            event.preventDefault()
                          }
                          await markAsRead(notification.id)
                          setOpen(false)
                        }}
                        className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-[#FFF9EF] ${notification.is_read ? 'opacity-60' : 'bg-amber-50/40'}`}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-slate-900">{notification.title || 'Dispatch Update'}</p>
                          <Badge label={notification.type} variant={notification.type} />
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{truncate(notification.message, 90)}</p>
                        <p className="mt-2 text-[10px] font-medium text-slate-400">{timeAgo(notification.created_at)}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleProfileClick}
            className="hidden items-center gap-2 rounded-xl border border-[#D7CCAD] bg-[#F8F4EA] px-3 py-1.5 transition hover:bg-[#EFE6D1] sm:flex"
          >
            <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} online />
            <div className="leading-tight text-left">
              <p className="text-xs font-black text-[#2D271C]">{profile?.full_name || 'Rescue Driver'}</p>
              {/* Prioritized live data stream binding rule */}
              <p className="text-[10px] text-[#6E634B] font-medium">{authenticatedEmail}</p>
            </div>
          </button>

          <button
            onClick={handleSignOut}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-black uppercase tracking-wider text-red-700 transition hover:bg-red-100"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>

    </header>
  )
}