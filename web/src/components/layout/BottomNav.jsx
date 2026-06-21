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
    isActive: (p) => p.startsWith('/dashboard/driver/history') || p.startsWith('/dashboard/driver/activity') 
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
        className="flex flex-col items-center justify-center pt-2.5 pb-2 px-1 transition-all duration-200 group min-w-[3.75rem] active:scale-95"
        aria-current={isActive ? 'page' : undefined}
      >
        {/* Taller background pill wrapper h-8 -> h-9 */}
        <div className={`inline-flex h-9 w-12 items-center justify-center rounded-xl transition-all duration-300 ${isActive ? 'bg-[#F5D108] text-[#1F1B10] shadow-md shadow-[#F5D108]/15' : 'bg-transparent text-[#7C6B44] group-hover:text-[#BAAFA0]'}`}>
          <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`mt-1.5 text-[9.5px] font-black uppercase tracking-wider transition-colors ${isActive ? 'text-[#F5D108]' : 'text-[#7C6B44]'}`}>
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
      <div className="fixed left-0 right-0 bottom-0 z-50 md:hidden pointer-events-auto bg-[#1F1B10] border-t border-white/[0.06] pt-1 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-10px_35px_rgba(0,0,0,0.55)]">
        {/* Taller internal row context h-14 -> h-16 */}
        <nav className="mx-auto flex w-full items-center justify-between max-w-md h-16">
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
      {/* Taller wrapper container base box alignment padding */}
      <div className="fixed left-0 right-0 bottom-0 z-50 md:hidden pointer-events-none pb-[calc(env(safe-area-inset-bottom)+0.25rem)]">
        
        {/* Floating SOS Trigger shifted upward to look proportionate with taller nav */}
        <div className="absolute left-1/2 top-[-30px] -translate-x-1/2 z-50">
          <button
            onClick={handleEmergency}
            aria-label="Request Rescue"
            className="pointer-events-auto flex h-15 w-15 items-center justify-center rounded-full bg-[#F5D108] text-[#1F1B10] shadow-[0_10px_28px_rgba(245,209,8,0.4)] active:scale-90 transition-transform duration-150 border-[5px] border-[#1F1B10] relative group"
          >
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-active:opacity-100 transition-opacity" />
            <Wrench size={22} strokeWidth={2.5} className="transform group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        {/* Carved Navigation Bar */}
        <nav className="pointer-events-auto relative w-full bg-[#1F1B10] border-t border-white/[0.06] pt-1 px-2 shadow-[0_-10px_35px_rgba(0,0,0,0.55)]">
          {/* Custom Inward Carve Visual Simulator Blocks enlarged for clean curves */}
          <div className="absolute top-[-5px] left-1/2 -translate-x-1/2 w-22 h-5 bg-[#1F1B10] rounded-t-3xl border-t border-x border-white/[0.06] z-10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[78px] h-4 bg-[#1F1B10] z-20" />

          {/* Expanded bar layout container h-14 -> h-16 */}
          <div className="relative z-30 mx-auto flex w-full items-center justify-between max-w-md h-16">
            <div className="flex flex-1 items-center justify-around">
              {leftItems.map(renderNavItem)}
            </div>

            {/* Gap structure space for button alignment widened */}
            <div className="w-18 shrink-0 h-full" />

            <div className="flex flex-1 items-center justify-around">
              {rightItems.map(renderNavItem)}
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}