import { HugeiconsIcon } from '@hugeicons/react'
import type { CategoryId } from '@shared/types'
import { categoryStyle } from '@/lib/categories'
import { cn } from '@/lib/utils'

const SIZE = {
  sm: { box: 'size-7 rounded-xl', icon: 'size-4' },
  md: { box: 'size-11 rounded-2xl', icon: 'size-5.5' },
} as const

export function CategoryTile({
  category,
  size = 'md',
  className,
}: {
  category: CategoryId
  size?: keyof typeof SIZE
  className?: string
}) {
  const { icon, color } = categoryStyle(category)
  const dimensions = SIZE[size]

  return (
    <span
      aria-hidden
      style={{ backgroundColor: color }}
      className={cn('grid shrink-0 place-items-center border-2 border-ink text-ink-stamp', dimensions.box, className)}
    >
      <HugeiconsIcon icon={icon} className={dimensions.icon} strokeWidth={2} />
    </span>
  )
}
