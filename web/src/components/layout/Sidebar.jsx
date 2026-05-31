'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { ChartColumn, Gauge, History, Home, LifeBuoy, LogOut, Radar, Settings, ShieldCheck, User, ClipboardList, WifiSync, Brain, PlusCircle } from 'lucide-react'

import Avatar from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'

const navByRole = {
  driver: [
    { href: '/dashboard/driver', label: 'Dashboard', icon: Home },
    { href: '/dashboard/driver/ai', label: 'AI Diagnostics', icon: Brain },
    { href: '/dashboard/driver/history', label: 'Incident Archive', icon: History },
    { href: '/dashboard/driver/account', label: 'Account', icon: User },
  ],
  mechanic: [
    { href: '/dashboard/mechanic', label: 'Dashboard', icon: Home },
    { href: '/dashboard/mechanic/requests', label: 'Active Jobs', icon: Radar },
    { href: '/dashboard/mechanic/history', label: 'Job History', icon: History },
    { href: '/dashboard/mechanic/support', label: 'Support', icon: LifeBuoy },
    { href: '/dashboard/mechanic/account', label: 'Profile', icon: User },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: Gauge },
    { href: '/dashboard/admin/reviews', label: 'Edits Review', icon: ShieldCheck },
    { href: '/dashboard/admin/requests', label: 'Incidents', icon: Radar },
    { href: '/dashboard/admin/mechanics', label: 'Mechanics', icon: User },
    { href: '/dashboard/admin/reports', label: 'Analytics', icon: ChartColumn },
    { href: '/dashboard/admin/users', label: 'Identity Hub', icon: ShieldCheck },
    { href: '/dashboard/admin/account', label: 'Account', icon: Settings },
  ],
}

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useAuth()

  const role = profile?.role || 'driver'
  const links = navByRole[role] || []
  
  const isAdmin = role === 'admin'
  const isMechanic = role === 'mechanic'
  const isDriver = role === 'driver'

  async function handleSignOut() {
    await signOut()
    router.replace('/auth/login')
  }

  // Base theme definitions matching your exact color scheme matrix
  const sidebarClass = isAdmin
    ? 'bg-[#2A261C] text-[#EFE8D4] border-r border-[#3A3428]'
    : 'bg-[#F1EAD6] text-[#2A261C] border-r border-[#D8CCAE]'

  const activeClass = isAdmin
    ? 'bg-[#F5D108] text-[#2A261C] shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]'
    : 'bg-[#F5D108] text-[#2A261C] shadow-sm'

  const idleClass = isAdmin
    ? 'text-[#E2D9C2] hover:bg-[#383223] hover:text-[#F5EED9]'
    : 'text-[#433C2B] hover:bg-[#E8DFC6] hover:text-[#2A261C]'

  return (
    // Tablet-first shell: show the sidebar from md upward and keep mobile on bottom nav only
    <aside className={`hidden md:fixed md:left-0 md:top-0 md:z-40 md:flex md:h-screen md:w-64 md:flex-col ${sidebarClass}`}>
      
      {/* BRANDING LOGO BLOCK */}
      <div className="px-5 pb-5 pt-6 text-center border-b border-black/5 mb-4">
        <Image
          src="/images/logo.png"
          alt="RoadRescue"
          width={42}
          height={42}
          className="mx-auto rounded-full h-auto shadow-sm"
        />
        <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.2em] ${isAdmin ? 'text-[#C1B596]' : 'text-[#786D53]'}`}>
          {isAdmin ? 'Ghana Operations' : isMechanic ? 'Mechanic Pro' : 'Driver Terminal'}
        </p>
      </div>

      {/* CORE INTERACTIVE NAV LINKS */}
      <nav className="flex-1 space-y-1 px-3">
        {(() => {
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
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-black uppercase tracking-wider transition ${isActive ? activeClass : idleClass}`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {link.label}
              </Link>
            )
          })
        })()}
      </nav>

      {/* FOOTER USER MANAGEMENT & CTA HUB */}
      <div className="px-3 pb-4 pt-3 space-y-3 border-t border-black/5 bg-black/1">
        {isAdmin ? (
          <Link
            href="/dashboard/admin/requests"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F5D108] text-xs font-black uppercase tracking-wider text-[#2A261C] shadow-sm"
          >
            <ClipboardList size={14} /> New Dispatch
          </Link>
        ) : isDriver ? (
          <Link
            href="/dashboard/driver/request/new"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-slate-800 transition"
          >
            <PlusCircle size={14} /> Request Aid
          </Link>
        ) : (
          <button
            type="button"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F5D108] text-xs font-black uppercase tracking-wider text-[#2A261C] shadow-sm"
          >
            <WifiSync size={14} /> Go Online
          </button>
        )}

        {/* ACCOUNT SNAPSHOT PROFILE BOX */}
        <div className={`rounded-xl border p-3 ${isAdmin ? 'border-[#4A4230] bg-[#2F2A20]' : 'border-[#D8CCAE]/60 bg-[#EAE0C7]/50'}`}>
          <div className="flex items-center gap-3">
            <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} size="md" />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-xs font-black tracking-tight ${isAdmin ? 'text-[#F2EAD7]' : 'text-[#2A261C]'}`}>{profile?.full_name || 'RoadRescue User'}</p>
              <p className={`text-[10px] uppercase font-black tracking-widest mt-0.5 ${isAdmin ? 'text-[#B6AA8D]' : 'text-[#6E644D]'}`}>{role}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className={`mt-3 inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border text-[11px] font-black uppercase tracking-wider transition ${isAdmin ? 'border-[#534B38] text-[#F2EAD7] hover:bg-[#3A3428]' : 'border-[#CDBD97] text-[#3D3627] hover:bg-[#E1D6BA]'}`}
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}