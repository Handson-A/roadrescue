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
        'w-full max-w-full min-w-0 box-border rounded-3xl border border-border bg-white p-4 shadow-soft transition',
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