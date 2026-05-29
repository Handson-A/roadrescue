// 'use client';

// /**
//  * Card Component
//  * Container for grouped content
//  */

// export default function Card({ children, className = '' }) {
//   return (
//     <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
//       {children}
//     </div>
//   );
// }

// web/src/components/ui/Card.jsx

// export default function Card({ children, className = '', glow = false, onClick }) {
//   return (
//     <div
//       onClick={onClick}
//       className={[
//         'card animate-fade-in',
//         glow ? 'shadow-amber border-amber/30' : '',
//         onClick ? 'cursor-pointer hover:border-amber/50 transition-colors' : '',
//         className,
//       ].join(' ')}
//     >
//       {children}
//     </div>
//   )
// }
import { cn } from '@/lib/utils'

export default function Card({
  children,
  className,
  onClick,
  variant = 'default',
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'rounded-3xl border border-border bg-white p-4 shadow-soft transition',
        variant === 'raised' && 'shadow-lift',
        variant === 'soft' && 'bg-surfaceAlt',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lift focus-ring',
        className
      )}
    >
      {children}
    </div>
  )
}