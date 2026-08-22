
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