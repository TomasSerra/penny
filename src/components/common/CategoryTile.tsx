import { CATEGORY_BY_ID } from '@shared/catalog'
import type { CategoryId } from '@shared/types'
import { cn } from '@/lib/utils'

export function CategoryTile({ category, className }: { category: CategoryId; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-2xl bg-foreground/[0.04] text-xl ring-1 ring-foreground/[0.05] ring-inset dark:bg-white/[0.06]',
        className,
      )}
    >
      {CATEGORY_BY_ID[category]?.emoji ?? '📦'}
    </span>
  )
}
