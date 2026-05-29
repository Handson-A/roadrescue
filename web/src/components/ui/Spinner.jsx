// 'use client';

// /**
//  * Spinner Component
//  * Loading indicator
//  */

// export default function Spinner({ size = 'md', className = '' }) {
//   const sizes = {
//     sm: 'h-4 w-4',
//     md: 'h-8 w-8',
//     lg: 'h-12 w-12',
//   };

//   return (
//     <div className={`animate-spin rounded-full border-b-2 border-red-600 ${sizes[size]} ${className}`}></div>
//   );
// }

// web/src/components/ui/Spinner.jsx

// export default function Spinner({ size = 'md', color = 'amber' }) {
//   const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
//   const colors = { amber: 'border-amber', white: 'border-white', muted: 'border-text-muted' }

//   return (
//     <div
//       className={`${sizes[size]} animate-spin rounded-full border-2 ${colors[color]} border-t-transparent`}
//     />
//   )
// }

import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

export default function Spinner({ size = 'md', className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent text-primary',
        sizeMap[size] || sizeMap.md,
        className
      )}
    />
  )
}