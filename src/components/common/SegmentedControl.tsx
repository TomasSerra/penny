import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { motion } from 'motion/react'
import { useId, type MouseEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  icon?: IconSvgElement
  ariaLabel?: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  options: SegmentOption<T>[]
  onChange: (value: T, event: MouseEvent<HTMLButtonElement>) => void
  size?: 'sm' | 'md'
  className?: string
  stretch?: boolean
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
  className,
  stretch,
}: SegmentedControlProps<T>) {
  const layoutId = useId()
  return (
    <div
      role="radiogroup"
      className={cn('glass inline-flex items-center rounded-full p-1', stretch && 'flex w-full', className)}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            onClick={(event) => onChange(option.value, event)}
            className={cn(
              'relative flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
              stretch && 'flex-1',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-background shadow-[0_1px_2px_oklch(0_0_0/0.08),0_4px_12px_-4px_oklch(0_0_0/0.12)] dark:bg-white/12"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {option.icon && <HugeiconsIcon icon={option.icon} className={size === 'sm' ? 'size-3.5' : 'size-4'} strokeWidth={1.8} />}
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
