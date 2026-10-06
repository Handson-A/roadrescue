'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Smartphone, X, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_ALLOWED_ROUTES = [
  '/login',
  '/auth/login',
  '/dashboard/driver/account',
  '/dashboard/mechanic/account',
  '/dashboard/admin/account',
  '/profile',
  '/account',
]

/**
 * Reusable PWA Install Toast / Prompt Component
 * 
 * @param {Object} props
 * @param {string[]|null} [props.allowedRoutes] - Specific routes to allow, or null to allow any route where mounted
 * @param {number} [props.delayMs=1000] - Delay in ms before showing after mount
 * @param {number} [props.autoHideDuration=20000] - Duration in ms before auto-hiding
 * @param {string} [props.storageKey='pwa-toast-dismissed-permanently'] - LocalStorage key for permanent dismissal
 * @param {string} [props.className] - Additional classes for container
 * @param {string} [props.bottomOffset] - Custom CSS bottom position
 */
export default function PwaInstallToast({
  allowedRoutes = DEFAULT_ALLOWED_ROUTES,
  delayMs = 1000,
  autoHideDuration = 20000,
  storageKey = 'pwa-toast-dismissed-permanently',
  className = '',
  bottomOffset,
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  
  const showTimerRef = useRef(null)
  const autoHideTimerRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Defer state update to allow clean render and optional appearance delay
    showTimerRef.current = setTimeout(() => {
      // 1. Route validation (if allowedRoutes specified)
      const isRouteAllowed = !allowedRoutes || allowedRoutes.length === 0 || allowedRoutes.some((route) => {
        if (!pathname) return false
        return (
          pathname === route ||
          pathname.startsWith(`${route}/`) ||
          pathname.endsWith(route) ||
          (route.includes('account') && pathname.includes('/account')) ||
          (route.includes('profile') && pathname.includes('/profile'))
        )
      })

      // 2. Mobile viewport check
      const isMobile = window.innerWidth < 768 || window.matchMedia('(max-width: 767px)').matches

      // 3. Standalone PWA mode check
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        Boolean(window.navigator.standalone)

      // 4. Permanent dismissal check in localStorage
      const isDismissedPermanently = localStorage.getItem(storageKey) === 'true'

      const shouldShow = isRouteAllowed && isMobile && !isStandalone && !isDismissedPermanently

      if (shouldShow) {
        setIsVisible(true)

        // Set auto-hide timeout
        if (autoHideDuration > 0) {
          autoHideTimerRef.current = setTimeout(() => {
            setIsVisible(false)
          }, autoHideDuration)
        }
      }
    }, Math.max(0, delayMs))

    // Capture beforeinstallprompt event for Chromium / Android
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    // Auto-dismiss if app was successfully installed
    const handleAppInstalled = () => {
      setIsVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [pathname, allowedRoutes, delayMs, autoHideDuration, storageKey])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsVisible(false)
        setDeferredPrompt(null)
      }
    } else {
      // Fallback (iOS or browser without deferredPrompt): navigate to guided install page
      setIsVisible(false)
      router.push('/install')
    }
  }

  const handleDontShowAgain = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true')
    }
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current)
    setIsVisible(false)
  }

  const handleCloseSession = () => {
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current)
    setIsVisible(false)
  }

  if (!isVisible) return null

  // Calculate bottom positioning based on whether route has a bottom navigation bar
  const isDashboardPage = pathname?.startsWith('/dashboard')
  const defaultBottom = isDashboardPage
    ? 'calc(5.75rem + env(safe-area-inset-bottom, 0px))'
    : 'calc(1.25rem + env(safe-area-inset-bottom, 0px))'

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        bottom: bottomOffset || defaultBottom,
        zIndex: 9999,
      }}
      className={cn(
        'fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md',
        'rounded-2xl border border-amber-200 bg-white p-4',
        'shadow-[0_12px_36px_rgba(15,23,42,0.18)]',
        'animate-slide-up transition-all',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* App / Smartphone Icon Badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Smartphone size={20} className="text-amber-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="text-sm font-black text-slate-900 leading-tight">
            Install RoadRescue App
          </h4>
          <p className="mt-1 text-xs text-slate-500 leading-normal">
            Install for instant roadside assistance, offline access, and faster response times.
          </p>

          {/* Controls */}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-xs transition-colors hover:bg-amber-500 active:scale-95"
            >
              <Download size={14} />
              <span>Install</span>
            </button>

            <button
              type="button"
              onClick={handleDontShowAgain}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Don’t show again
            </button>
          </div>
        </div>

        {/* Close Button (Session Dismiss) */}
        <button
          type="button"
          onClick={handleCloseSession}
          aria-label="Close notification"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
