import { motion } from 'motion/react'
import type { BudgetSummary } from '@shared/budget'
import type { Currency } from '@shared/types'
import { Money } from '@/components/common/Money'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Stack order matches the validated categorical slot order, so neighbors stay distinguishable. */
export const ALLOCATIONS = [
  { key: 'variable', label: 'Gastos variables', color: 'var(--chart-1)' },
  { key: 'fixed', label: 'Gastos fijos', color: 'var(--chart-2)' },
  { key: 'shortTerm', label: 'Ahorro corto plazo', color: 'var(--chart-3)' },
  { key: 'longTerm', label: 'Ahorro largo plazo', color: 'var(--chart-4)' },
] as const

export function allocationRows(summary: BudgetSummary) {
  const values = {
    variable: summary.variableARS,
    fixed: summary.fixedARS,
    shortTerm: summary.shortTermARS,
    longTerm: summary.longTermARS,
  }
  const pct = summary.pct
  return ALLOCATIONS.map((item) => ({ ...item, ars: values[item.key], pct: pct[item.key] }))
}

export function AllocationBar({ summary, className }: { summary: BudgetSummary; className?: string }) {
  const rows = allocationRows(summary).filter((row) => row.pct > 0)
  const total = rows.reduce((acc, row) => acc + row.pct, 0) || 1

  return (
    <div
      className={cn('flex h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-paper-card', className)}
      role="img"
      aria-label="Distribución del ingreso neto"
    >
      {rows.length === 0 ? null : (
        rows.map((row, index) => (
          <motion.div
            key={row.key}
            className={cn('h-full', index > 0 && 'border-l-2 border-ink')}
            style={{ background: row.color }}
            initial={{ flexGrow: 0 }}
            animate={{ flexGrow: row.pct / total }}
            transition={{ duration: 0.9, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
          />
        ))
      )}
    </div>
  )
}

export function AllocationLegend({
  summary,
  currency = 'ARS',
  rate,
  layout = 'grid',
}: {
  summary: BudgetSummary
  currency?: Currency
  rate: number
  layout?: 'grid' | 'list'
}) {
  const convert = (ars: number) => (currency === 'USD' ? (rate ? ars / rate : 0) : ars)
  const secondary = (ars: number) => (currency === 'USD' ? ars : rate ? ars / rate : 0)
  const secondaryCurrency: Currency = currency === 'USD' ? 'ARS' : 'USD'

  return (
    <ul className={cn(layout === 'grid' ? 'grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4' : 'flex flex-col divide-y divide-border')}>
      {allocationRows(summary).map((row) => (
        <li key={row.key} className={cn('min-w-0', layout === 'list' && 'flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0')}>
          <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ background: row.color }} />
            <span className="truncate">{row.label}</span>
            {layout === 'list' && <span className="shrink-0 tabular-nums">· {formatPercent(row.pct)}</span>}
          </span>
          <span className={cn('flex flex-col', layout === 'list' ? 'items-end' : 'mt-1')}>
            <Money value={convert(row.ars)} currency={currency} className={cn('font-semibold', layout === 'grid' ? 'text-xl' : 'text-base')} />
            <span className="flex items-baseline gap-1 text-xs text-muted-foreground">
              {layout === 'grid' && <span className="tabular-nums">{formatPercent(row.pct)} ·</span>}
              <Money value={secondary(row.ars)} currency={secondaryCurrency} />
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
