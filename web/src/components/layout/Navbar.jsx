// 'use client';

// /**
//  * Navbar Component
//  * Top navigation bar with user profile and controls
//  */

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Avatar from '@/components/ui/Avatar';

// export default function Navbar({ user, role }) {
//   const router = useRouter();
//   const [showMenu, setShowMenu] = useState(false);

//   const handleLogout = () => {
//     // Clear auth and redirect to login
//     sessionStorage.removeItem('auth_token');
//     router.push('/login');
//   };

//   return (
//     <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
//       <div>
//         <h1 className="text-xl font-bold text-gray-900">
//           {role === 'driver' && 'Driver Dashboard'}
//           {role === 'mechanic' && 'Mechanic Dashboard'}
//           {role === 'admin' && 'Admin Dashboard'}
//         </h1>
//       </div>

//       {/* User Menu */}
//       <div className="relative">
//         <button
//           onClick={() => setShowMenu(!showMenu)}
//           className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition"
//         >
//           <Avatar src={user?.avatar} alt={user?.name} size="sm" />
//           <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
//         </button>

//         {showMenu && (
//           <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
//             <a
//               href="/profile"
//               className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//             >
//               Profile
//             </a>
//             <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
//               Settings
//             </a>
//             <hr className="my-2" />
//             <button
//               onClick={handleLogout}
//               className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
//             >
//               Logout
//             </button>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }

// web/src/components/layout/Navbar.jsx
// Top bar — shows page title + notification bell

// 'use client'

// import { useNotifications } from '@/hooks/useNotifications'
// import { useAuth } from '@/hooks/useAuth'
// import { useState } from 'react'
// import { timeAgo } from '@/lib/utils'

// export default function Navbar({ title }) {
//   const { user } = useAuth()
//   const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id)
//   const [open, setOpen] = useState(false)

//   return (
//     <header className="h-14 border-b border-surface-border bg-surface-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
//       <h1 className="text-sm font-semibold text-text-primary">{title}</h1>

//       {/* notification bell */}
//       <div className="relative">
//         <button
//           onClick={() => setOpen(!open)}
//           className="relative p-2 text-text-secondary hover:text-text-primary transition-colors"
//         >
//           {/* bell icon */}
//           <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//           </svg>
//           {unreadCount > 0 && (
//             <span className="absolute top-1 right-1 w-4 h-4 bg-amber text-black text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-amber">
//               {unreadCount > 9 ? '9+' : unreadCount}
//             </span>
//           )}
//         </button>

//         {/* dropdown */}
//         {open && (
//           <div className="absolute right-0 top-10 w-80 card shadow-card z-50 animate-slide-up">
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-sm font-semibold">Notifications</span>
//               {unreadCount > 0 && (
//                 <button
//                   onClick={markAllAsRead}
//                   className="text-xs text-amber hover:text-amber-light transition-colors"
//                 >
//                   Mark all read
//                 </button>
//               )}
//             </div>

//             <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
//               {notifications.length === 0 && (
//                 <p className="text-sm text-text-muted text-center py-6">No notifications</p>
//               )}
//               {notifications.map(n => (
//                 <button
//                   key={n.id}
//                   onClick={() => markAsRead(n.id)}
//                   className={[
//                     'w-full text-left px-3 py-2.5 rounded-btn transition-colors text-sm',
//                     n.is_read
//                       ? 'text-text-muted hover:bg-surface-raised'
//                       : 'bg-amber/5 border border-amber/10 text-text-primary',
//                   ].join(' ')}
//                 >
//                   <p className="leading-snug">{n.message}</p>
//                   <p className="text-xs text-text-muted mt-0.5">{timeAgo(n.created_at)}</p>
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </header>
//   )
// }

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
  const router = useRouter()
  const { profile } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(profile?.id)
  const role = profile?.role || 'driver'
  const roleBase = `/dashboard/${role}`
  const isDashboardRoot = pathname === roleBase || pathname === `${roleBase}/`
  const firstName = profile?.full_name?.split(' ')?.[0] || 'RoadRescue'

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

  const getMobileTitle = () => {
    if (isDashboardRoot) {
      return role === 'admin' ? 'Admin dashboard' : role === 'mechanic' ? 'Mechanic dashboard' : 'Driver dashboard'
    }

    if (pathname.includes('/request/')) return 'Live tracking'
    if (pathname.includes('/activity')) return 'Activity'
    if (pathname.includes('/history')) return 'History'
    if (pathname.includes('/account')) return 'Profile'
    if (pathname.includes('/settings')) return 'Settings'
    if (pathname.includes('/reports')) return 'Reports'
    if (pathname.includes('/mechanics')) return 'Mechanics'
    if (pathname.includes('/requests')) return 'Requests'

    return role === 'admin' ? 'Admin panel' : role === 'mechanic' ? 'Mechanic panel' : 'Driver panel'
  }

  const mobileSubtitle = isDashboardRoot
    ? 'Ready for dispatch'
    : pathname.includes('/request/')
      ? 'Track the assignment in real time'
      : pathname.includes('/activity')
        ? 'Recent activity and operational updates'
      : pathname.includes('/history')
        ? 'Recent activity and completed jobs'
        : pathname.includes('/account')
          ? 'Profile and security settings'
          : 'Secure RoadRescue session'

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="md:hidden border-b border-[#3A3428] bg-[#2A261C] text-[#EFE8D4]">
        {isDashboardRoot ? (
          <div className="px-4 pb-5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-[#7C7767]">Good morning.</p>
                <h1 className="mt-1 truncate font-black text-2xl text-[#EFE8D4]">{firstName}</h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpen((prev) => !prev)}
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#3A3428]/10 bg-[#EFE8D4]/5 text-[#EFE8D4] shadow-lg shadow-black/20"
                  aria-label="Open notifications"
                >
                  <Bell size={18} strokeWidth={2} />
                  {unreadCount > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#FFD700' }} />}
                </button>

                <button
                  onClick={handleProfileClick}
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[#FFD700]/30 bg-[#FFD700] text-[#111827] shadow-lg shadow-[#00000026]"
                  aria-label="Open profile"
                >
                  <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} size="sm" />
                </button>
              </div>
            </div>

            <form
              className="mt-4 flex items-center gap-3 rounded-3xl bg-[#F3F4F6]/10 px-4 py-3 ring-1 ring-[#7C7767]/10"
              onSubmit={(event) => event.preventDefault()}
            >
              <Search size={16} className="shrink-0 text-[#7C7767]" />
              <input
                type="search"
                placeholder="Search location or service..."
                className="min-w-0 flex-1 bg-transparent text-sm text-[#EFE8D4] placeholder:text-[#7C7767] outline-none"
              />
              <button
                type="submit"
                className="flex h-10 min-w-10 items-center justify-center rounded-full bg-[#FFD700] px-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#111827]"
              >
                Go
              </button>
            </form>

            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full border border-[#7C7767]/20 bg-[#F3F4F6]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#7C7767]">
                Secure session
              </span>
              <span className="rounded-full border border-[#FFD700]/20 bg-[#FFD700]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFD700]">
                {activeRescueCount} incidents
              </span>
            </div>
          </div>
        ) : (
              <div className="relative px-4 pb-4 pt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE8D4] text-[#2A261C] shadow-lg shadow-black/15"
                aria-label="Go back"
              >
                <ArrowLeft size={18} strokeWidth={2.2} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="inline-flex max-w-full items-center rounded-full bg-[#EFE8D4] px-4 py-2 shadow-lg shadow-black/10 ring-1" style={{ ringColor: '#D8CCAE' }}>
                  <span className="truncate text-sm font-semibold text-[#2A261C]">{getMobileTitle()}</span>
                </div>
                <p className="mt-2 truncate text-xs text-[#7C7767]">{mobileSubtitle}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpen((prev) => !prev)}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE8D4] text-[#2A261C] shadow-lg shadow-black/10"
                  aria-label="Open notifications"
                >
                  <Bell size={17} strokeWidth={2} />
                  {unreadCount > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#FFD700' }} />}
                </button>

                <button
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3A3428] text-[#EFE8D4] shadow-lg shadow-black/10"
                  aria-label="Open menu"
                >
                  <Menu size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            {mobileMenuOpen && (
              <div className="absolute right-4 top-19 z-50 w-56 overflow-hidden rounded-3xl border" style={{ borderColor: '#D8CCAE', backgroundColor: '#EFE6D1', color: '#2A261C' }}>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleProfileClick()
                  }}
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold hover:bg-[#EFE6D1]/80"
                >
                  <span>Profile</span>
                  <ShieldCheck size={14} className="text-emerald-500" />
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <span>Sign out</span>
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden items-center justify-between gap-4 border-b border-[#D8CCAE] bg-[#F5F0E2] px-4 py-3 md:flex lg:px-6">
        <div className="min-w-0 flex items-center gap-4">
          <h1 className="truncate text-[2.8rem] leading-none font-black text-[#6A5A10]">RoadRescue</h1>
          {(role === 'admin' || role === 'mechanic') && (
            <span className="rounded-full border border-[#C8BC9E] bg-[#EFE6D1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6F654D]">
              {role === 'admin' ? 'Operations' : 'Field Ops'}
            </span>
          )}
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
            className={`rounded-xl border p-2 ${audioEnabled ? 'border-[#C8BC9E] bg-[#EDE2CA] text-[#6A5A10]' : 'border-[#D7CCAD] bg-[#F8F4EA] text-[#7A7058]'}`}
            title={audioEnabled ? 'Mute alerts' : 'Unmute alerts'}
          >
            {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <div className="relative">
            <button onClick={() => setOpen((prev) => !prev)} className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#D7CCAD] bg-[#F8F4EA] text-[#3B3528] shadow-sm">
              <Bell size={18} strokeWidth={2} />
              {unreadCount > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger" />}
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-[min(92vw,24rem)] overflow-hidden rounded-3xl border border-border bg-white shadow-lift">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Notifications</p>
                    <p className="text-xs text-muted">Live dispatch updates</p>
                  </div>
                  {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs font-semibold text-primary">Mark all read</button>}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted">No notifications yet</div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`block w-full border-b border-border px-4 py-3 text-left transition hover:bg-surfaceAlt ${notification.is_read ? 'opacity-70' : 'bg-primary/5'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{notification.title || 'Dispatch update'}</p>
                              <Badge label={notification.type} variant={notification.type} />
                            </div>
                            <p className="mt-1 text-sm text-muted">{truncate(notification.message, 110)}</p>
                            <p className="mt-2 text-[11px] text-muted">{timeAgo(notification.created_at)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="hidden h-11 w-11 items-center justify-center rounded-xl border border-[#D7CCAD] bg-[#F8F4EA] text-[#5A513C] lg:inline-flex" aria-label="Settings">
            <Settings size={17} />
          </button>

          <button className="hidden h-11 w-11 items-center justify-center rounded-xl border border-[#D7CCAD] bg-[#F8F4EA] text-[#5A513C] lg:inline-flex" aria-label="Help">
            <CircleHelp size={17} />
          </button>

          <button
            onClick={handleProfileClick}
            className="hidden items-center gap-2 rounded-xl border border-[#D7CCAD] bg-[#F8F4EA] px-2.5 py-1.5 transition hover:bg-[#EFE6D1] sm:flex"
            title="Account settings"
          >
            <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} online />
            <div className="leading-tight">
              <p className="text-xs font-black text-[#2D271C]">{profile?.full_name || 'RoadRescue User'}</p>
              <p className="flex items-center gap-1 text-[10px] text-[#6E634B]">
                {profile?.email || 'profile@roadrescue.gh'}
                <ShieldCheck size={12} className="text-emerald-500" />
              </p>
            </div>
          </button>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-black uppercase tracking-wide text-red-700 transition hover:bg-red-100"
          >
            <LogOut size={14} strokeWidth={2} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(42,38,28,0.12)' }} onClick={() => setOpen(false)} />
          <div className="absolute right-4 top-29 z-50 w-[min(92vw,24rem)] overflow-hidden rounded-3xl" style={{ borderColor: '#D8CCAE', backgroundColor: '#EFE6D1', color: '#2A261C' }}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-xs text-muted">Live dispatch updates</p>
              </div>
              {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs font-semibold text-primary">Mark all read</button>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted">No notifications yet</div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`block w-full border-b border-border px-4 py-3 text-left transition hover:bg-surfaceAlt ${notification.is_read ? 'opacity-70' : 'bg-primary/5'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{notification.title || 'Dispatch update'}</p>
                          <Badge label={notification.type} variant={notification.type} />
                        </div>
                        <p className="mt-1 text-sm text-muted">{truncate(notification.message, 110)}</p>
                        <p className="mt-2 text-[11px] text-muted">{timeAgo(notification.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}