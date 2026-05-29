// 'use client';

// /**
//  * Avatar Component
//  * User profile image with fallback
//  */

// export default function Avatar({ src, alt, size = 'md', className = '' }) {
//   const sizes = {
//     sm: 'h-8 w-8',
//     md: 'h-12 w-12',
//     lg: 'h-16 w-16',
//   };

//   return (
//     <img
//       src={src || '/images/placeholder-avatar.png'}
//       alt={alt}
//       className={`rounded-full object-cover ${sizes[size]} ${className}`}
//     />
//   );
// }


import Image from 'next/image'
import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

function getInitials(name = 'User') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'
}

export default function Avatar({
  src,
  name = 'User',
  size = 'md',
  online = false,
  className,
}) {
  const initials = getInitials(name)
  const sizePxMap = { sm: 32, md: 40, lg: 56 }
  const sizePx = sizePxMap[size] || sizePxMap.md

  return (
    <div className="relative inline-flex shrink-0">
      {src ? (
        <Image
          src={src}
          alt={name}
          width={sizePx}
          height={sizePx}
          className={cn(
            'rounded-full object-cover ring-1 ring-border',
            sizeMap[size] || sizeMap.md,
            className
          )}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full border border-primary/15 bg-primary/12 font-semibold text-primary',
            sizeMap[size] || sizeMap.md,
            className
          )}
        >
          {initials}
        </div>
      )}

      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success" />
      )}
    </div>
  )
}