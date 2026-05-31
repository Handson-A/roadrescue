'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Wrench, Brain, ArrowUpDown, User, ClipboardList, History, MapPin, Briefcase } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

const driverNav = [
  { 
    href: '/dashboard/driver', 
    label: 'Home', 
    icon: Home, 
    isActive: (p) => p === '/dashboard/driver' || p === '/dashboard/driver/' 
  },
  { 
    href: '/dashboard/driver/ai', 
    label: 'AI Assist', 
    icon: Brain, 
    isActive: (p) => p.startsWith('/dashboard/driver/ai') 
  },
  { 
    href: '/dashboard/driver/history', 
    label: 'Activity', 
    icon: ArrowUpDown, 
    isActive: (p) => p.startsWith('/dashboard/driver/history') || p.startsWith('/dashboard/driver/activity') || p.includes('/request') 
  },
  { 
    href: '/dashboard/driver/account', 
    label: 'Profile', 
    icon: User, 
    isActive: (p) => p.startsWith('/dashboard/driver/account') 
  },
]

const mechanicNav = [
  { 
    href: '/dashboard/mechanic', 
    label: 'Jobs', 
    icon: Briefcase, 
    isActive: (p) => p === '/dashboard/mechanic' || p === '/dashboard/mechanic/' || p.includes('/dashboard/mechanic/jobs') || p.includes('/dashboard/mechanic/job/') 
  },
  { 
    href: '/dashboard/mechanic/requests', 
    label: 'Requests', 
    icon: ClipboardList, 
    isActive: (p) => p.startsWith('/dashboard/mechanic/requests') 
  },
  { 
    href: '/dashboard/mechanic/navigation', 
    label: 'Navigation', 
    icon: MapPin, 
    isActive: (p) => p.startsWith('/dashboard/mechanic/navigation') || p.startsWith('/dashboard/mechanic/track') 
  },
  { 
    href: '/dashboard/mechanic/history', 
    label: 'Activity', 
    icon: History, 
    isActive: (p) => p.startsWith('/dashboard/mechanic/history') || p.startsWith('/dashboard/mechanic/activity') 
  },
  { 
    href: '/dashboard/mechanic/account', 
    label: 'Profile', 
    icon: User, 
    isActive: (p) => p.startsWith('/dashboard/mechanic/account') 
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()
  const role = profile?.role || 'driver'

  if (role === 'admin') return null

  const handleEmergency = () => {
    router.push('/dashboard/driver/request/new')
  }

  // Common item renderer to maintain design consistency
  const renderNavItem = (item) => {
    const Icon = item.icon
    const isActive = item.isActive(pathname)

    return (
      <Link
        key={item.href}
        href={item.href}
        className="flex flex-col items-center justify-center py-1.5 px-1 transition-all duration-200 group min-w-[3.75rem] active:scale-95"
        aria-current={isActive ? 'page' : undefined}
      >
        <div className={`inline-flex h-8 w-11 items-center justify-center rounded-xl transition-all duration-300 ${isActive ? 'bg-[#F5D108] text-[#1F1B10] shadow-md shadow-[#F5D108]/10' : 'bg-transparent text-[#7C6B44] group-hover:text-[#BAAFA0]'}`}>
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`mt-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-[#F5D108]' : 'text-[#7C6B44]'}`}>
          {item.label}
        </span>
      </Link>
    )
  }

  // ==================================================================== 
  // MECHANIC MODE: 5-Tab Flat Premium Distribution Bar
  // ==================================================================== 
  if (role === 'mechanic') {
    return (
      <div className="fixed left-0 right-0 bottom-0 z-50 md:hidden pointer-events-auto bg-[#1F1B10] border-t border-white/[0.06] pt-1 px-3 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <nav className="mx-auto flex w-full items-center justify-between max-w-md h-14">
          {mechanicNav.map(renderNavItem)}
        </nav>
      </div>
    )
  }

  // ==================================================================== 
  // DRIVER MODE: Split Cradle Layout with Center SOS Anchor
  // ==================================================================== 
  const halfLength = Math.ceil(driverNav.length / 2)
  const leftItems = driverNav.slice(0, halfLength)
  const rightItems = driverNav.slice(halfLength)

  return (
    <>
      <div className="fixed left-0 right-0 bottom-0 z-50 md:hidden pointer-events-none pb-[env(safe-area-inset-bottom)]">
        
        {/* Floating SOS Trigger */}
        <div className="absolute left-1/2 top-[-26px] -translate-x-1/2 z-50">
          <button
            onClick={handleEmergency}
            aria-label="Request Rescue"
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F5D108] text-[#1F1B10] shadow-[0_8px_24px_rgba(245,209,8,0.35)] active:scale-90 transition-transform duration-150 border-[5px] border-[#1F1B10] relative group"
          >
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-active:opacity-100 transition-opacity" />
            <Wrench size={20} strokeWidth={2.5} className="transform group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        {/* Carved Navigation Bar */}
        <nav className="pointer-events-auto relative w-full bg-[#1F1B10] border-t border-white/[0.06] pt-1 px-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          {/* Custom Inward Carve Visual Simulator Blocks */}
          <div className="absolute top-[-5px] left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1F1B10] rounded-t-2xl border-t border-x border-white/[0.06] z-10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[72px] h-4 bg-[#1F1B10] z-20" />

          <div className="relative z-30 mx-auto flex w-full items-center justify-between max-w-md h-14">
            <div className="flex flex-1 items-center justify-around">
              {leftItems.map(renderNavItem)}
            </div>

            {/* Gap structure space for button alignment */}
            <div className="w-16 shrink-0 h-full" />

            <div className="flex flex-1 items-center justify-around">
              {rightItems.map(renderNavItem)}
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}