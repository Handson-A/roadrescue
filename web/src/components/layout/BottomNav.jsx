'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Home, Wrench, Brain, ArrowUpDown, User, ClipboardList, History, MapPin, Briefcase } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

const driverNav = [
  { href: '/dashboard/driver', label: 'Home', icon: Home, isActive: (p) => p === '/dashboard/driver' || p === '/dashboard/driver/' },
  { href: '/dashboard/driver/ai', label: 'AI Assist', icon: Brain, isActive: (p) => p.startsWith('/dashboard/driver/ai') },
  { href: '/dashboard/driver/history', label: 'Activity', icon: ArrowUpDown, isActive: (p) => p.startsWith('/dashboard/driver/history') || p.startsWith('/dashboard/driver/activity') },
  { href: '/dashboard/driver/account', label: 'Profile', icon: User, isActive: (p) => p.startsWith('/dashboard/driver/account') },
]

const mechanicNav = [
  { href: '/dashboard/mechanic', label: 'Jobs', icon: Briefcase, isActive: (p) => p === '/dashboard/mechanic' || p === '/dashboard/mechanic/' || p.includes('/dashboard/mechanic/jobs') || p.includes('/dashboard/mechanic/job/') },
  { href: '/dashboard/mechanic/requests', label: 'Requests', icon: ClipboardList, isActive: (p) => p.startsWith('/dashboard/mechanic/requests') },
  { href: '/dashboard/mechanic/navigation', label: 'Navigation', icon: MapPin, isActive: (p) => p.startsWith('/dashboard/mechanic/navigation') || p.startsWith('/dashboard/mechanic/track') },
  { href: '/dashboard/mechanic/history', label: 'Activity', icon: History, isActive: (p) => p.startsWith('/dashboard/mechanic/history') || p.startsWith('/dashboard/mechanic/activity') },
  { href: '/dashboard/mechanic/account', label: 'Profile', icon: User, isActive: (p) => p.startsWith('/dashboard/mechanic/account') },
]

// Detect soft keyboard open by comparing window.innerHeight to visualViewport.height.
// When the keyboard slides up, visualViewport shrinks but window.innerHeight stays the same.
// A difference of more than 150px is a reliable signal that the keyboard is open.
function useKeyboardOpen() {
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    function check() {
      // Check if any text-based input or editable context currently holds focus
      const activeEl = document.activeElement
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase()
        const isInput = tagName === 'input' && ['text', 'email', 'tel', 'password', 'search', 'number', 'url'].includes(activeEl.type)
        const isTextarea = tagName === 'textarea'
        const isEditable = activeEl.hasAttribute('contenteditable') && activeEl.getAttribute('contenteditable') !== 'false'
        if (isInput || isTextarea || isEditable) {
          setKeyboardOpen(true)
          return
        }
      }

      // Check visualViewport changes as fallback
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height
        setKeyboardOpen(heightDiff > 150)
      } else {
        setKeyboardOpen(false)
      }
    }

    // Monitor focus events globally on the document level
    document.addEventListener('focusin', check)
    document.addEventListener('focusout', check)
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', check)
      window.visualViewport.addEventListener('scroll', check)
    }
    
    check()

    return () => {
      document.removeEventListener('focusin', check)
      document.removeEventListener('focusout', check)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', check)
        window.visualViewport.removeEventListener('scroll', check)
      }
    }
  }, [])

  return keyboardOpen
}

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()
  const role = profile?.role || 'driver'
  const keyboardOpen = useKeyboardOpen()

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (keyboardOpen) {
      document.body.classList.add('keyboard-open')
    } else {
      document.body.classList.remove('keyboard-open')
    }
    return () => {
      document.body.classList.remove('keyboard-open')
    }
  }, [keyboardOpen])

  if (role === 'admin') return null

  // Hide the entire nav when the keyboard is open — avoids it
  // floating over the input dock and wasting visible screen space.
  if (keyboardOpen) return null

  const handleEmergency = () => router.push('/dashboard/driver/request/new')

  const renderNavItem = (item) => {
    const Icon = item.icon
    const isActive = item.isActive(pathname)

    return (
      <Link
        key={item.href}
        href={item.href}
        className="flex flex-col items-center justify-center pt-2.5 pb-2 px-1 transition-all duration-200 ease-in-out group min-w-15 active:scale-95"
        aria-current={isActive ? 'page' : undefined}
      >
        <div className={`inline-flex h-9 w-12 items-center justify-center rounded-xl transition-all duration-200 ease-in-out ${
          isActive 
            ? 'bg-[#F5D108]/15 text-[#F5D108] scale-110 shadow-[0_2px_8px_rgba(245,209,8,0.1)]' 
            : 'bg-transparent text-[#9E9E9E] group-hover:text-white'
        }`}>
          <Icon size={19} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-200 ease-in-out group-active:scale-110" />
        </div>
        <span className={`mt-1.5 text-[9.5px] font-black uppercase tracking-wider transition-colors duration-200 ${isActive ? 'text-[#F5D108]' : 'text-[#9E9E9E]'}`}>
          {item.label}
        </span>
      </Link>
    )
  }

  // ── MECHANIC: flat 5-tab bar ──────────────────────────────────────────────
  if (role === 'mechanic') {
    return (
      <div className="fixed left-0 right-0 bottom-0 z-50 md:hidden bg-[#1A1A1A] border-t border-white/6 pt-1 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-10px_35px_rgba(0,0,0,0.55)]">
        <nav className="mx-auto flex w-full items-center justify-between max-w-md h-18">
          {mechanicNav.map(renderNavItem)}
        </nav>
      </div>
    )
  }

  // ── DRIVER: split cradle with center SOS button ───────────────────────────
  const halfLength = Math.ceil(driverNav.length / 2)
  const leftItems = driverNav.slice(0, halfLength)
  const rightItems = driverNav.slice(halfLength)

  return (
    <div className="fixed left-0 right-0 bottom-0 z-50 md:hidden pointer-events-none pb-[calc(env(safe-area-inset-bottom)+0.25rem)]">

      {/* Floating SOS button */}
      <div className="absolute left-1/2 -top-8.5 -translate-x-1/2 z-50">
        <button
          onClick={handleEmergency}
          aria-label="Request Rescue"
          className="pointer-events-auto flex h-15 w-15 items-center justify-center rounded-full bg-[#F5D108] text-[#1F1B10] shadow-[0_4px_12px_rgba(245,209,8,0.4)] active:scale-90 hover:scale-105 transition-all duration-200 ease-in-out border-[4px] border-[#1A1A1A] relative group"
        >
          <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-active:opacity-100 transition-opacity" />
          <Wrench size={22} strokeWidth={2.5} className="transform group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Nav bar with carved center */}
      <nav className="pointer-events-auto relative w-full bg-[#1A1A1A] border-t border-white/6 pt-1 px-2 shadow-[0_-10px_35px_rgba(0,0,0,0.55)]">
        <div className="absolute -top-1.25 left-1/2 -translate-x-1/2 w-22 h-6 bg-[#1A1A1A] border-t border-x border-white/6 z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-19.5 h-4 bg-[#1A1A1A] z-20" />

        <div className="relative z-30 mx-auto flex w-full items-center justify-between max-w-md h-18">
          <div className="flex flex-1 items-center justify-around">
            {leftItems.map(renderNavItem)}
          </div>
          <div className="w-18 shrink-0 h-full" />
          <div className="flex flex-1 items-center justify-around">
            {rightItems.map(renderNavItem)}
          </div>
        </div>
      </nav>
    </div>
  )
}