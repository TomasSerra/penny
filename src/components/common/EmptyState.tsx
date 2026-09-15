import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: IconSvgElement
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="relative mb-5 grid size-16 place-items-center">
        <div className="absolute inset-0 rounded-full bg-penny/20 blur-xl" />
        <div className="glass relative grid size-16 place-items-center rounded-3xl">
          <HugeiconsIcon icon={icon} className="size-7 text-penny-ink" strokeWidth={1.6} />
        </div>
      </div>
      <h3 className="font-display text-xl leading-tight">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-balance text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
