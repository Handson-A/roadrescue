// 'use client';

// /**
//  * Modal Component
//  * Overlay dialog for important actions
//  */

// export default function Modal({ isOpen, onClose, title, children, actions }) {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
//         {/* Header */}
//         <div className="border-b flex items-center justify-between p-6">
//           <h2 className="text-lg font-bold text-gray-900">{title}</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600 text-2xl"
//           >
//             ×
//           </button>
//         </div>

//         {/* Content */}
//         <div className="p-6">{children}</div>

//         {/* Actions */}
//         {actions && (
//           <div className="border-t p-6 flex gap-3 justify-end">
//             {actions}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


// web/src/components/ui/Modal.jsx
// Accessible modal — closes on backdrop click and Escape key

// import { useEffect } from 'react'

// export default function Modal({ open, onClose, title, children, size = 'md' }) {
//   const sizes = {
//     sm: 'max-w-sm',
//     md: 'max-w-lg',
//     lg: 'max-w-2xl',
//   }

//   useEffect(() => {
//     function handleKey(e) {
//       if (e.key === 'Escape') onClose()
//     }
//     if (open) document.addEventListener('keydown', handleKey)
//     return () => document.removeEventListener('keydown', handleKey)
//   }, [open, onClose])

//   if (!open) return null

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       {/* backdrop */}
//       <div
//         className="absolute inset-0 bg-black/70 backdrop-blur-sm"
//         onClick={onClose}
//       />
//       {/* panel */}
//       <div className={`relative w-full ${sizes[size]} card shadow-card animate-slide-up`}>
//         {/* header */}
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-base font-semibold text-text-primary">{title}</h2>
//           <button
//             onClick={onClose}
//             className="text-text-muted hover:text-text-primary transition-colors"
//           >
//             ✕
//           </button>
//         </div>
//         {children}
//       </div>
//     </div>
//   )
// }

'use client'

import { useEffect } from 'react'

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
                className="rounded-full border border-border p-2 text-muted hover:bg-surfaceAlt hover:text-foreground focus-ring"
                aria-label="Close"
              >
                ✕
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