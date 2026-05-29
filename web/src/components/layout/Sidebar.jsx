// 'use client';


'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChartColumn, ClipboardList, Gauge, Handshake, History, Home, LifeBuoy, LogOut, Radar, Settings, ShieldCheck, User, Users, Wrench, CarFront } from 'lucide-react'

import Avatar from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'

const navByRole = {
  mechanic: [
    { href: '/dashboard/mechanic', label: 'Home', icon: Home },
    { href: '/dashboard/mechanic/requests', label: 'Active Jobs', icon: Radar },
    { href: '/dashboard/mechanic/history', label: 'Job History', icon: History },
    { href: '/dashboard/mechanic/account', label: 'Earnings', icon: ChartColumn },
    { href: '/dashboard/mechanic/settings', label: 'Profile', icon: User },
    { href: '/dashboard/mechanic/support', label: 'Support', icon: LifeBuoy },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: Gauge },
    { href: '/dashboard/admin/reviews', label: 'Edits Review', icon: ShieldCheck },
    { href: '/dashboard/admin/requests', label: 'Incidents', icon: Radar },
    { href: '/dashboard/admin/mechanics', label: 'Mechanics', icon: CarFront },
    { href: '/dashboard/admin/reports', label: 'Analytics', icon: ChartColumn },
    { href: '/dashboard/admin/users', label: 'Identity Hub', icon: ShieldCheck },
    { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
  ],
}

export default function Sidebar() {
  const pathname = usePathname()
  const { profile } = useAuth()

  const role = profile?.role || 'driver'
  const links = navByRole[role] || []
  const isAdmin = role === 'admin'
  const isMechanic = role === 'mechanic'

  if (!isAdmin && !isMechanic) {
    return null
  }

  async function handleSignOut() {
    await signOut()
    window.location.href = '/auth/login'
  }

  const sidebarClass = isAdmin
    ? 'bg-[#2A261C] text-[#EFE8D4] border-r border-[#3A3428]'
    : 'bg-[#F1EAD6] text-[#2A261C] border-r border-[#D8CCAE]'

  const activeClass = isAdmin
    ? 'bg-[#F5D108] text-[#2A261C] shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]'
    : 'bg-[#F5D108] text-[#2A261C]'

  const idleClass = isAdmin
    ? 'text-[#E2D9C2] hover:bg-[#383223] hover:text-[#F5EED9]'
    : 'text-[#433C2B] hover:bg-[#E8DFC6] hover:text-[#2A261C]'

  return (
    <aside className={`hidden lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:flex lg:h-screen lg:w-64 lg:flex-col ${sidebarClass}`}>
      <div className="px-5 pb-5 pt-4">
        <Image
          src="/images/logo.png"
          alt="RoadRescue"
          width={40}
          height={40}
          className="rounded-full"
        />
        <p className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${isAdmin ? 'text-[#C1B596]' : 'text-[#786D53]'}`}>
          {isAdmin ? 'Ghana Operations' : 'Mechanic Pro'}
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {(() => {
          // compute the most specific active link (longest matching prefix)
          const activeHref = links.reduce((best, l) => {
            if (pathname === l.href || pathname.startsWith(`${l.href}/`)) {
              return !best || l.href.length > best.length ? l.href : best
            }
            return best
          }, '')

          return links.map((link) => {
            const Icon = link.icon
            const isActive = link.href === activeHref || pathname === link.href

            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? activeClass : idleClass}`}
              >
                <Icon size={17} strokeWidth={2} />
                {link.label}
              </Link>
            )
          })
        })()}
      </nav>

      <div className="px-3 pb-4 pt-3 space-y-3">
        {isAdmin ? (
          <Link
            href="/dashboard/admin/requests"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F5D108] text-sm font-bold text-[#2A261C]"
          >
            <ClipboardList size={16} /> New Dispatch
          </Link>
        ) : (
          <button
            type="button"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F5D108] text-sm font-bold text-[#2A261C]"
          >
            <Handshake size={16} /> Go Online
          </button>
        )}

        <div className={`rounded-xl border p-3 ${isAdmin ? 'border-[#4A4230] bg-[#2F2A20]' : 'border-[#D8CCAE] bg-[#EAE0C7]'}`}>
          <div className="flex items-center gap-3">
            <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} size="md" />
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${isAdmin ? 'text-[#F2EAD7]' : 'text-[#2A261C]'}`}>{profile?.full_name || 'RoadRescue user'}</p>
              <p className={`text-xs capitalize ${isAdmin ? 'text-[#B6AA8D]' : 'text-[#6E644D]'}`}>{role}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className={`mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border text-xs font-semibold ${isAdmin ? 'border-[#534B38] text-[#F2EAD7] hover:bg-[#3A3428]' : 'border-[#CDBD97] text-[#3D3627] hover:bg-[#E1D6BA]'}`}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
