import type { ReactNode } from 'react'
import { Penny, type PennyPose } from '@/components/brand/Penny'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** Which mood Penny shows up in — pick one that fits why the screen is empty. */
  pose: PennyPose
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  /** Tighter layout for empty states nested inside a card. */
  compact?: boolean
  className?: string
}

export function EmptyState({ pose, title, description, action, compact, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center px-6 text-center',
        // Page-level empty states are sized to fit a notched phone without scrolling (see EmptyStateCard).
        compact ? 'py-12' : 'py-6 max-md:[@media(max-height:700px)]:py-4 md:py-12',
        className,
      )}
    >
      <Penny pose={pose} className={cn('mb-4 -rotate-2', compact ? 'h-20' : 'h-24 max-md:[@media(max-height:700px)]:h-16 md:h-32')} />
      <h3 className={cn('font-display leading-tight', compact ? 'text-lg' : 'text-xl')}>{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-balance text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Card for a page-level empty state. On mobile it takes the rest of the screen, so the page never scrolls. */
export function EmptyStateCard({ children }: { children: ReactNode }) {
  return <div className="paper flex flex-col justify-center rounded-4xl max-md:flex-1">{children}</div>
}
