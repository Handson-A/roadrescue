'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Wrench, Brain, Bell, User, ClipboardList, CarFront, History, MapPin, Briefcase } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

// Palette (strict):
// Primary: #FFD700, Secondary: #111827, Tertiary: #F3F4F6, Neutral: #7C7767

const driverNav = [
  { href: '/dashboard/driver', label: 'Home', icon: Home, isActive: (p) => p === '/dashboard/driver' || (p.startsWith('/dashboard/driver') && !p.includes('/request')) },
  { href: '/dashboard/driver/request/new', label: 'Rescue', icon: Wrench, isActive: (p) => p.includes('/dashboard/driver/request') },
  { href: '/dashboard/driver/ai', label: 'AI Assist', icon: Brain, isActive: (p) => p.includes('/dashboard/driver/ai') },
  { href: '/dashboard/driver/activity', label: 'Activity', icon: Bell, isActive: (p) => p.includes('/dashboard/driver/activity') || p.includes('/dashboard/driver/history') },
  { href: '/dashboard/driver/account', label: 'Profile', icon: User, isActive: (p) => p.includes('/dashboard/driver/account') },
]

const mechanicNav = [
  { href: '/dashboard/mechanic', label: 'Jobs', icon: Briefcase, isActive: (p) => p === '/dashboard/mechanic' || p.includes('/dashboard/mechanic/jobs') || p.includes('/dashboard/mechanic/job') },
  { href: '/dashboard/mechanic/requests', label: 'Requests', icon: ClipboardList, isActive: (p) => p.includes('/dashboard/mechanic/requests') },
  { href: '/dashboard/mechanic/navigation', label: 'Navigation', icon: MapPin, isActive: (p) => p.includes('/dashboard/mechanic/navigation') || p.includes('/dashboard/mechanic/track') },
  { href: '/dashboard/mechanic/activity', label: 'Activity', icon: History, isActive: (p) => p.includes('/dashboard/mechanic/activity') || p.includes('/dashboard/mechanic/history') },
  { href: '/dashboard/mechanic/account', label: 'Profile', icon: User, isActive: (p) => p.includes('/dashboard/mechanic/account') },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()
  const role = profile?.role || 'driver'

  // hide bottom nav for admin users
  if (role === 'admin') return null

  const navItems = role === 'mechanic' ? mechanicNav : driverNav

  // emergency action: opens request rescue for drivers, opens requests for mechanics
  const handleEmergency = () => {
    if (role === 'mechanic') {
      router.push('/dashboard/mechanic/requests')
      return
    }

    router.push('/dashboard/driver/request/new')
  }

  return (
    <>
      {/* Mobile bottom navigation: fixed to the base, full width, not floating */}
      <nav className="fixed left-0 right-0 bottom-0 z-50 md:hidden bg-[#2A261C] border-t border-[#7C7767] rounded-t-lg">
        <div className="mx-auto flex w-full max-w-none items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.isActive(pathname)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 py-3 text-center transition-colors ${isActive ? 'text-[#111827]' : 'text-[#7C7767]'}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`mx-auto inline-flex h-10 w-10 items-center justify-center rounded-lg ${isActive ? 'bg-[#FFD700]' : 'bg-transparent'}`}>
                  <Icon size={20} strokeWidth={2} className={`${isActive ? 'text-[#111827]' : 'text-[#7C7767]'}`} />
                </div>
                <div className={`mt-1 text-[11px] font-semibold ${isActive ? 'text-[#FFD700]' : 'text-[#7C7767]'}`}>{item.label}</div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Floating Emergency Action Button (centered above the nav) */}
      <button
        onClick={handleEmergency}
        aria-label="Request Rescue"
        className="fixed left-1/2 z-50 -translate-x-1/2 md:hidden"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: '#FFD700', color: '#111827' }}>
          <Wrench size={24} strokeWidth={2} />
        </div>
      </button>
    </>
  )
}

