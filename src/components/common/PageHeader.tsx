import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-sm text-muted-foreground">{eyebrow}</p>}
        <h1 className="font-display text-[2.35rem] leading-[1.03] md:text-5xl">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
