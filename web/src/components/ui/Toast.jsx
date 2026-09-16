'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { Check, X, Info, AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'

const ToastContext = createContext(null)

const iconMap = {
  success: Check,
  error: X,
  info: Info,
  warning: AlertTriangle,
}

const colorMap = {
  success: 'border-success/20 bg-success/10 text-success',
  error: 'border-danger/20 bg-danger/10 text-danger',
  info: 'border-slate-200 bg-slate-50 text-slate-700',
  warning: 'border-warning/20 bg-warning/10 text-warning',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((current) => current.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{ top: '1rem', right: '1rem', position: 'fixed', zIndex: 9999 }}
        className="flex w-[min(92vw,24rem)] flex-col gap-2"
      >
        {toasts.map((toastItem) => {
          const IconComponent = iconMap[toastItem.type] || iconMap.info
          return (
            <div
              key={toastItem.id}
              className={cn(
                'flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lift animate-slide-up',
                colorMap[toastItem.type] || colorMap.info
              )}
            >
              <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-xs font-black text-current shrink-0">
                <IconComponent size={14} />
              </span>
              <p className="text-sm font-medium leading-relaxed text-foreground">
                {toastItem.message}
              </p>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }

  return context
}