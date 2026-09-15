import { PieChartIcon } from '@hugeicons/core-free-icons'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { CATEGORY_BY_ID } from '@shared/catalog'
import type { CategoryId, Currency, Expense } from '@shared/types'
import { ChartCard, DataTable } from '@/components/common/ChartCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Money } from '@/components/common/Money'
import { formatMoney, formatPercent } from '@/lib/format'

const VISIBLE = 6

interface Row {
  key: string
  emoji: string
  label: string
  value: number
}

export function CategoryBreakdown({ expenses, currency }: { expenses: Expense[]; currency: Currency }) {
  const { rows, all, total } = useMemo(() => {
    const totals = new Map<CategoryId, number>()
    for (const expense of expenses) {
      const amount = currency === 'USD' ? expense.amountUSD : expense.amountARS
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + amount)
    }
    const sorted: Row[] = [...totals.entries()]
      .map(([id, value]) => ({ key: id, emoji: CATEGORY_BY_ID[id]?.emoji ?? '📦', label: CATEGORY_BY_ID[id]?.label ?? id, value }))
      .sort((a, b) => b.value - a.value)
    const sum = sorted.reduce((acc, row) => acc + row.value, 0)
    // Past six categories the tail folds into one row so bars stay comparable.
    const visible =
      sorted.length > VISIBLE + 1
        ? [
            ...sorted.slice(0, VISIBLE),
            { key: 'rest', emoji: '•••', label: `${sorted.length - VISIBLE} categorías más`, value: sorted.slice(VISIBLE).reduce((acc, row) => acc + row.value, 0) },
          ]
        : sorted
    return { rows: visible, all: sorted, total: sum }
  }, [expenses, currency])

  const max = Math.max(...rows.map((row) => row.value), 0)

  return (
    <ChartCard
      title="Por categoría"
      description={total > 0 ? `${all.length} ${all.length === 1 ? 'categoría' : 'categorías'} este mes` : undefined}
      table={
        all.length > 0 ? (
          <DataTable
            columns={['Categoría', 'Monto', '%']}
            rows={all.map((row) => [`${row.emoji} ${row.label}`, formatMoney(row.value, currency), formatPercent((row.value / total) * 100)])}
          />
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <EmptyState icon={PieChartIcon} title="Sin gastos todavía" className="py-6" />
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((row, index) => (
            <li key={row.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden className="w-5 shrink-0 text-center leading-none">
                    {row.emoji}
                  </span>
                  <span className="truncate">{row.label}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">{formatPercent((row.value / total) * 100, 0)}</span>
                  <Money value={row.value} currency={currency} tabular className="font-medium" />
                </span>
              </div>
              <div className="h-2 pl-7" aria-hidden>
                <motion.div
                  className="h-full rounded-r-[4px]"
                  style={{ background: 'var(--chart-1)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.max((row.value / max) * 100, 1.5)}%` }}
                  transition={{ duration: 0.8, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}
