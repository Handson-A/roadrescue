// 'use client';

// /**
//  * Input Component
//  * Reusable form input field
//  */

// export default function Input({
//   label,
//   placeholder,
//   type = 'text',
//   value,
//   onChange,
//   error,
//   required = false,
//   ...props
// }) {
//   return (
//     <div className="mb-4">
//       {label && (
//         <label className="block text-sm font-semibold text-gray-700 mb-2">
//           {label}
//           {required && <span className="text-red-600">*</span>}
//         </label>
//       )}
//       <input
//         type={type}
//         placeholder={placeholder}
//         value={value}
//         onChange={onChange}
//         className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
//           error ? 'border-red-500' : 'border-gray-300'
//         }`}
//         {...props}
//       />
//       {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
//     </div>
//   );
// }


// web/src/components/ui/Input.jsx

// export default function Input({
//   label,
//   error,
//   hint,
//   leftIcon,
//   rightIcon,
//   className = '',
//   ...props
// }) {
//   return (
//     <div className="flex flex-col gap-1.5">
//       {label && (
//         <label className="text-sm font-medium text-text-primary">{label}</label>
//       )}
//       <div className="relative">
//         {leftIcon && (
//           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
//             {leftIcon}
//           </span>
//         )}
//         <input
//           className={[
//             'w-full bg-surface-raised border border-surface-border rounded-btn',
//             'px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted',
//             'focus:outline-none focus:border-amber transition-colors',
//             error ? 'border-red-500' : '',
//             leftIcon  ? 'pl-9'  : '',
//             rightIcon ? 'pr-9'  : '',
//             className,
//           ].join(' ')}
//           {...props}
//         />
//         {rightIcon && (
//           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
//             {rightIcon}
//           </span>
//         )}
//       </div>
//       {error && <p className="text-xs text-red-400">{error}</p>}
//       {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
//     </div>
//   )
// }

import { cn } from '@/lib/utils'

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) {
  const inputId = id || props.name || label?.toLowerCase().replace(/\s+/g, '-')
  const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted shadow-sm transition focus-ring',
            leftIcon && 'pl-11',
            rightIcon && 'pr-11',
            error && 'border-danger/50 ring-1 ring-danger/20',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}