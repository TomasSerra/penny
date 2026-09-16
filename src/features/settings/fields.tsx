import { Loading03Icon, Refresh01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { useId } from 'react'
import { RATE_TYPES } from '@shared/rates'
import type { RateConfig, RateSide } from '@shared/types'
import { Button } from '@/components/ui/button'
import { useQuotes } from '@/data/rates'
import { formatMoney, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * The dollar quote grid, shared by Settings and the onboarding: every rate dolarapi
 * publishes, with its live value on the chosen side.
 */
export function RatePicker({ value, onChange, className }: { value: RateConfig; onChange: (rate: RateConfig) => void; className?: string }) {
  const { data: quotes, isFetching, refetch, dataUpdatedAt, isError } = useQuotes()
  const layoutId = useId()
  const side = value.side
  const otherSide: RateSide = side === 'compra' ? 'venta' : 'compra'

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {RATE_TYPES.map((type) => {
          const quote = quotes?.find((item) => item.casa === type.id)
          const selected = value.type === type.id
          const amount = quote?.[side]
          const other = quote?.[otherSide]
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange({ ...value, type: type.id })}
              aria-pressed={selected}
              className={cn(
                'relative rounded-2xl bg-foreground/[0.03] p-3.5 text-left transition-colors outline-none hover:bg-foreground/[0.05] focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-white/[0.03]',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={layoutId}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                  className="absolute inset-0 rounded-2xl border-2 border-ink bg-penny/25"
                />
              )}
              <span className="relative flex items-center justify-between text-xs font-medium text-muted-foreground">
                {type.label}
                {selected && <HugeiconsIcon icon={Tick02Icon} className="size-4 text-penny-ink" strokeWidth={2.2} />}
              </span>
              <span className="relative mt-1 block text-lg font-semibold">
                {amount ? formatMoney(amount, 'ARS', { cents: !Number.isInteger(amount) }) : '—'}
              </span>
              <span className="relative block text-[11px] text-muted-foreground">
                {other ? `${otherSide === 'compra' ? 'Compra' : 'Venta'} ${formatMoney(other, 'ARS', { cents: !Number.isInteger(other) })}` : ' '}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {isError ? 'No se pudo actualizar la cotización' : 'Fuente: dolarapi.com'}
          {dataUpdatedAt > 0 && ` · actualizado ${formatTime(new Date(dataUpdatedAt))}`}
        </span>
        <Button variant="ghost" size="sm" onClick={() => void refetch()} disabled={isFetching}>
          <HugeiconsIcon icon={isFetching ? Loading03Icon : Refresh01Icon} className={isFetching ? 'animate-spin' : ''} />
          Actualizar
        </Button>
      </div>
    </div>
  )
}
