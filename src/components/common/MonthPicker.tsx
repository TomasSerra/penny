import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { addMonths, monthKeyOf, parseMonthKey, toMonthKey } from '@shared/dates'
import type { MonthKey } from '@shared/types'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatMonth, formatShortMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

interface MonthPickerProps {
  month: MonthKey
  onChange: (month: MonthKey) => void
  className?: string
}

export function MonthPicker({ month, onChange, className }: MonthPickerProps) {
  const [direction, setDirection] = useState(0)
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => parseMonthKey(month).year)
  const current = monthKeyOf(new Date())

  const select = (next: MonthKey) => {
    setDirection(next > month ? 1 : -1)
    onChange(next)
  }

  return (
    <div className={cn('glass inline-flex h-11 items-center rounded-full p-1', className)}>
      <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => select(addMonths(month, -1))} aria-label="Mes anterior">
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
      </Button>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) setYear(parseMonthKey(month).year)
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative h-9 w-36 overflow-hidden rounded-full text-sm font-medium outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.span
                key={month}
                custom={direction}
                initial={{ y: direction * 14, opacity: 0, filter: 'blur(3px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: direction * -14, opacity: 0, filter: 'blur(3px)' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {formatMonth(month)}
              </motion.span>
            </AnimatePresence>
          </button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-72 rounded-3xl p-3">
          <div className="mb-2 flex items-center justify-between">
            <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => setYear(year - 1)} aria-label="Año anterior">
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <span className="text-sm font-semibold tabular-nums">{year}</span>
            <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => setYear(year + 1)} aria-label="Año siguiente">
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, index) => {
              const key = toMonthKey(year, index + 1)
              const selected = key === month
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    select(key)
                    setOpen(false)
                  }}
                  className={cn(
                    'relative h-10 rounded-xl text-sm capitalize transition-colors',
                    selected ? 'coin font-semibold' : 'hover:bg-accent',
                    key === current && !selected && 'text-penny-ink font-semibold',
                  )}
                >
                  {formatShortMonth(key)}
                </button>
              )
            })}
          </div>
          {month !== current && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                select(current)
                setOpen(false)
              }}
            >
              Ir al mes actual
            </Button>
          )}
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => select(addMonths(month, 1))} aria-label="Mes siguiente">
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
      </Button>
    </div>
  )
}
