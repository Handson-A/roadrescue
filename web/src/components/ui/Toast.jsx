// 'use client';

// /**
//  * Toast Component
//  * Notification message display
//  */

// import { useState, useEffect } from 'react';

// export default function Toast({ message, type = 'info', duration = 5000, onClose }) {
//   const [isVisible, setIsVisible] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsVisible(false);
//       onClose?.();
//     }, duration);

//     return () => clearTimeout(timer);
//   }, [duration, onClose]);

//   if (!isVisible) return null;

//   const bgColor = {
//     success: 'bg-green-100 border-green-400 text-green-800',
//     error: 'bg-red-100 border-red-400 text-red-800',
//     warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
//     info: 'bg-blue-100 border-blue-400 text-blue-800',
//   }[type];

//   return (
//     <div className={`fixed bottom-4 right-4 p-4 border-l-4 rounded ${bgColor}`}>
//       {message}
//     </div>
//   );
// }


'use client'
import { createContext, useContext, useState, useCallback } from 'react'

import { cn } from '@/lib/utils'

const ToastContext = createContext(null)

const iconMap = {
  success: '✓',
  error: '✕',
  info: 'i',
  warning: '!',
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
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,24rem)] flex-col gap-2 safe-bottom-padding">
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            className={cn(
              'flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lift animate-slide-up',
              colorMap[toastItem.type] || colorMap.info
            )}
          >
            <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-xs font-black text-current">
              {iconMap[toastItem.type] || iconMap.info}
            </span>
            <p className="text-sm font-medium leading-relaxed text-foreground">
              {toastItem.message}
            </p>
          </div>
        ))}
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