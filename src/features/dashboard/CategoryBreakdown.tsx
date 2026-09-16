import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { useMemo } from 'react'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { CATEGORY_BY_ID } from '@shared/catalog'
import type { CategoryId, Currency, Expense } from '@shared/types'
import { ChartCard, ChartTooltipBox, DataTable } from '@/components/common/ChartCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { useExpenseComposer } from '@/features/expenses/ExpenseComposer'
import { categoryStyle } from '@/lib/categories'
import { formatCompact, formatMoney, formatPercent } from '@/lib/format'

const VISIBLE = 6

// The folded tail is the one slice with no category behind it, so it takes the neutral ink.
const REST_COLOR = 'var(--muted-foreground)'

interface Row {
  key: string
  /** The category's own tint, so a slice reads the same here as on any expense row. */
  color: string
  icon: IconSvgElement | null
  label: string
  value: number
}

/** The legend swatch and the row glyph are the same object: tinted chip, icon inside. */
function RowChip({ row }: { row: Row }) {
  return (
    <span
      aria-hidden
      style={{ backgroundColor: row.color }}
      className="grid size-5 shrink-0 place-items-center rounded-md border-2 border-ink text-ink-stamp"
    >
      {row.icon && <HugeiconsIcon icon={row.icon} className="size-3" strokeWidth={2.4} />}
    </span>
  )
}

const config = {} satisfies ChartConfig

export function CategoryBreakdown({ expenses, currency }: { expenses: Expense[]; currency: Currency }) {
  const composer = useExpenseComposer()
  const { rows, all, total } = useMemo(() => {
    const totals = new Map<CategoryId, number>()
    for (const expense of expenses) {
      const amount = currency === 'USD' ? expense.amountUSD : expense.amountARS
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + amount)
    }
    const sorted: Row[] = [...totals.entries()]
      .map(([id, value]) => {
        const { icon, color } = categoryStyle(id)
        return { key: id, icon, color, label: CATEGORY_BY_ID[id]?.label ?? id, value }
      })
      .sort((a, b) => b.value - a.value)
    const sum = sorted.reduce((acc, row) => acc + row.value, 0)
    // Past six categories the tail folds into one slice so the donut stays readable.
    const visible =
      sorted.length > VISIBLE + 1
        ? [
            ...sorted.slice(0, VISIBLE),
            {
              key: 'rest',
              icon: null,
              color: REST_COLOR,
              label: `${sorted.length - VISIBLE} categorías más`,
              value: sorted.slice(VISIBLE).reduce((acc, row) => acc + row.value, 0),
            },
          ]
        : sorted
    return { rows: visible, all: sorted, total: sum }
  }, [expenses, currency])

  return (
    <ChartCard
      className="h-full"
      title="Por categoría"
      description={total > 0 ? `${all.length} ${all.length === 1 ? 'categoría' : 'categorías'} este mes` : undefined}
      table={
        all.length > 0 ? (
          <DataTable
            columns={['Categoría', 'Monto', '%']}
            rows={all.map((row) => [
              <span key={row.key} className="flex items-center gap-2">
                <RowChip row={row} />
                {row.label}
              </span>,
              formatMoney(row.value, currency),
              formatPercent((row.value / total) * 100),
            ])}
          />
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          compact
          className="my-auto py-6"
          pose="base"
          title="Sin gastos este mes"
          description="Cargá tus gastos y este anillo te muestra en qué se te va la plata, ordenado de mayor a menor."
          action={<Button variant="outline" onClick={() => composer.open()}>Cargar un gasto</Button>}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-44 flex-1">
            <ChartContainer config={config} className="aspect-auto size-full">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Tooltip
                  content={({ active, payload }) => {
                    const item = payload?.[0]?.payload as Row | undefined
                    if (!active || !item) return null
                    return (
                      <ChartTooltipBox
                        title={
                          <span className="flex items-center gap-2">
                            <RowChip row={item} />
                            {item.label}
                          </span>
                        }
                        rows={[
                          { label: 'Monto', value: formatMoney(item.value, currency) },
                          { label: 'Del total', value: formatPercent((item.value / total) * 100) },
                        ]}
                      />
                    )
                  }}
                />
                <Pie
                  data={rows}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="58%"
                  outerRadius="92%"
                  paddingAngle={2}
                  startAngle={90}
                  endAngle={-270}
                  stroke="var(--ink)"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={800}
                >
                  {rows.map((row) => (
                    <Cell key={row.key} fill={row.color} className="cursor-default outline-none" />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-display text-xl tabular-nums">{formatCompact(total, currency)}</p>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-1.5 text-sm">
            {rows.map((row) => (
              <li key={row.key} className="flex items-center gap-2">
                <RowChip row={row} />
                <span className="truncate">{row.label}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{formatPercent((row.value / total) * 100, 0)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  )
}
