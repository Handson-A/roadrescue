// 'use client';

// /**
//  * Button Component
//  * Reusable primary button for all interactions
//  */

// export default function Button({
//   children,
//   onClick,
//   type = 'button',
//   variant = 'primary',
//   disabled = false,
//   className = '',
//   ...props
// }) {
//   const baseStyles = 'px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';

//   const variants = {
//     primary: 'bg-red-600 text-white hover:bg-red-700',
//     secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
//     danger: 'bg-red-700 text-white hover:bg-red-800',
//     success: 'bg-green-600 text-white hover:bg-green-700',
//   };

//   return (
//     <button
//       type={type}
//       onClick={onClick}
//       disabled={disabled}
//       className={`${baseStyles} ${variants[variant]} ${className}`}
//       {...props}
//     >
//       {children}
//     </button>
//   );
// }

// web/src/components/ui/Button.jsx
// Variants: primary (amber filled), secondary (outlined), ghost, danger

// export default function Button({
//   children,
//   variant = 'primary',
//   size = 'md',
//   loading = false,
//   disabled = false,
//   fullWidth = false,
//   onClick,
//   type = 'button',
//   className = '',
// }) {
//   const base = [
//     'inline-flex items-center justify-center gap-2 font-semibold rounded-btn',
//     'transition-all duration-150 focus-visible:outline-none',
//     'disabled:opacity-40 disabled:cursor-not-allowed',
//     fullWidth ? 'w-full' : '',
//   ]

//   const sizes = {
//     sm: 'px-3 py-1.5 text-sm',
//     md: 'px-4 py-2.5 text-sm',
//     lg: 'px-6 py-3 text-base',
//   }

//   const variants = {
//     primary:   'bg-amber text-black hover:bg-amber-dark active:scale-[0.98] shadow-amber',
//     secondary: 'border border-surface-border text-text-primary hover:border-amber hover:text-amber bg-transparent',
//     ghost:     'text-text-secondary hover:text-text-primary hover:bg-surface-raised bg-transparent',
//     danger:    'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',
//   }

//   return (
//     <button
//       type={type}
//       onClick={onClick}
//       disabled={disabled || loading}
//       className={[...base, sizes[size], variants[variant], className].join(' ')}
//     >
//       {loading && (
//         <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
//           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
//         </svg>
//       )}
//       {children}
//     </button>
//   )
// }

import { cn } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

const variantMap = {
  primary: 'bg-primary text-white shadow-soft hover:bg-primaryDark hover:shadow-lift',
  secondary: 'bg-accent text-white hover:bg-slate-800 shadow-soft',
  outline: 'border border-border bg-white text-foreground hover:border-primary/40 hover:bg-surfaceAlt',
  ghost: 'bg-transparent text-foreground hover:bg-surfaceAlt',
  danger: 'bg-danger text-white hover:bg-red-700',
}

const sizeMap = {
  sm: 'h-10 px-3 text-sm rounded-xl',
  md: 'h-12 px-4 text-sm rounded-xl',
  lg: 'h-14 px-6 text-base rounded-2xl',
}

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition focus-ring disabled:cursor-not-allowed disabled:opacity-60',
        fullWidth && 'w-full',
        variantMap[variant] || variantMap.primary,
        sizeMap[size] || sizeMap.md,
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {!loading && leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  )
}