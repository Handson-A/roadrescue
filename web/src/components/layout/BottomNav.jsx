'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Wrench, Brain, Bell, User, ClipboardList, History, MapPin, Briefcase } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

// System Palette Mapping Strategy:
// Dark Canvas: #1F1B10 | Active Accent: #F5D108 | Inactive Dim: #7C6B44

const driverNav = [
  { 
    href: '/dashboard/driver', 
    label: 'Home', 
    icon: Home, 
    // FIXED: Strict evaluation matches exactly the root path or root path with a trailing slash
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
    icon: Bell, 
    // FIXED: Strict sub-route tracking binds history and general activity sub-trees cleanly
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

  // Hide bottom nav for admin configurations cleanly
  if (role === 'admin') return null

  const navItems = role === 'mechanic' ? mechanicNav : driverNav

  const handleEmergency = () => {
    if (role === 'mechanic') {
      router.push('/dashboard/mechanic/requests')
      return
    }
    router.push('/dashboard/driver/request/new')
  }

  return (
    <>
      {/* Mobile bottom navigation bar layout */}
      <nav className="fixed left-0 right-0 bottom-0 z-50 md:hidden bg-[#1F1B10] border-t border-[#DCCDA9]/20 px-2 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-1.5">
        <div className="mx-auto flex w-full items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.isActive(pathname)

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center py-1.5 px-3 transition-all duration-200 group min-w-[4.25rem]"
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Visual Icon Node Highlight Frame */}
                <div className={`inline-flex h-9 w-12 items-center justify-center rounded-xl transition-all duration-200 ${isActive ? 'bg-[#F5D108] text-[#1F1B10]' : 'bg-transparent text-[#7C6B44] group-hover:text-white'}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                {/* Label Typography Frame */}
                <span className={`mt-1 text-[10px] font-black uppercase tracking-wider transition-colors ${isActive ? 'text-[#F5D108]' : 'text-[#7C6B44]'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Floating Emergency Action Button (Centered precisely above the navigation bar framework) */}
      <div 
        className="fixed left-1/2 z-50 -translate-x-1/2 md:hidden pointer-events-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 3.75rem)' }}
      >
        <button
          onClick={handleEmergency}
          aria-label="Request Rescue"
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F5D108] text-[#1F1B10] shadow-[0_4px_20px_rgba(245,209,8,0.35)] active:scale-90 transition-transform duration-150 border-4 border-[#1F1B10]"
        >
          <Wrench size={20} strokeWidth={2.5} />
        </button>
      </div>
    </>
  )
}