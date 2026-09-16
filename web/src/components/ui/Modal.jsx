
'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

export default function Modal({
  isOpen,
  open,
  onClose,
  title,
  children,
  actions,
  size = 'md',
}) {
  const isVisible = open ?? isOpen

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', onKeyDown)
    }

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        aria-label="Close modal"
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-[91] w-full overflow-hidden rounded-[2rem] border border-border bg-white shadow-lift',
          sizeMap[size] || sizeMap.md
        )}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div>
              {title && <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-full border border-border p-2 text-muted hover:bg-surfaceAlt hover:text-foreground focus-ring cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <div className="px-5 py-5 sm:px-6">{children}</div>

        {actions && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-border bg-surfaceAlt px-5 py-4 sm:px-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}