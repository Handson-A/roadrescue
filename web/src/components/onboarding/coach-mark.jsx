'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, Zap } from 'lucide-react'

export default function CoachMark({
  targetSelector = '[data-tour="driver-skip-btn"]',
  title = 'Quick Skip',
  message = "In a hurry? Tap 'Skip' to go straight to the request form without waiting for the map.",
  onDismiss,
  isOpen = true,
}) {
  const [targetRect, setTargetRect] = useState(null)
  const [mounted, setMounted] = useState(false)
  const targetElRef = useRef(null)

  const updatePosition = useCallback(() => {
    if (targetElRef.current) {
      const rect = targetElRef.current.getBoundingClientRect()
      // Only set if element is visible and in viewport
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        })
      }
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen || !mounted) return

    let observer = null
    let timeoutId = null
    let found = false

    const findTarget = () => {
      const el = document.querySelector(targetSelector)
      if (el) {
        found = true
        targetElRef.current = el
        updatePosition()
        if (observer) observer.disconnect()
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    // Try finding immediately
    findTarget()

    if (!found) {
      observer = new MutationObserver(() => {
        findTarget()
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      })

      // Silently timeout after 1.5 seconds if target not found
      timeoutId = setTimeout(() => {
        if (observer) observer.disconnect()
      }, 1500)
    }

    // Reposition on scroll and resize
    window.addEventListener('resize', updatePosition, { passive: true })
    window.addEventListener('scroll', updatePosition, { passive: true })

    const resizeObserver = new ResizeObserver(updatePosition)
    if (document.body) resizeObserver.observe(document.body)

    return () => {
      if (observer) observer.disconnect()
      if (timeoutId) clearTimeout(timeoutId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [targetSelector, isOpen, mounted, updatePosition])

  // Keyboard accessibility: Escape key dismisses
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onDismiss?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onDismiss])

  if (!mounted || !isOpen || !targetRect) {
    return null
  }

  // Calculate popover positioning: place above or below target depending on screen space
  const spaceBelow = window.innerHeight - targetRect.bottom
  const placeAbove = spaceBelow < 180
  const popoverTop = placeAbove
    ? Math.max(16, targetRect.top - 140)
    : targetRect.bottom + 12

  // Center horizontally relative to target but clamp to viewport padding
  const rawLeft = targetRect.left + targetRect.width / 2 - 140
  const popoverLeft = Math.max(16, Math.min(window.innerWidth - 296, rawLeft))

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label={title}
      className="fixed inset-0 z-[99999] pointer-events-auto select-none"
    >
      {/* Semi-transparent dark overlay (one-tap anywhere outside closes) */}
      <div
        onClick={onDismiss}
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px] transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Spotlight Cutout Border Box */}
      <div
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
        className="absolute rounded-full ring-4 ring-amber-400/80 shadow-[0_0_24px_rgba(251,191,36,0.6)] pointer-events-none animate-pulse"
      />

      {/* Coach-Mark Card */}
      <div
        style={{
          top: popoverTop,
          left: popoverLeft,
        }}
        className="absolute w-[280px] rounded-2xl bg-[#1F1B10] border border-amber-400/40 text-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Zap size={15} className="shrink-0 fill-amber-400" />
            <h4 className="text-xs font-black uppercase tracking-wider">{title}</h4>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss hint"
            className="rounded-lg p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <p className="mt-2 text-xs text-white/90 leading-relaxed font-medium">{message}</p>

        <div className="mt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 text-[#1F1B10] text-[11px] font-black uppercase tracking-wider hover:bg-amber-300 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <span>Got it</span>
            <ChevronRight size={13} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
