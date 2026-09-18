import { Cancel01Icon, Download04Icon, FilterHorizontalIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useMemo, useState, type ReactNode } from 'react'
import { Cell, Pie, PieChart, Tooltip as ChartTooltip } from 'recharts'
import { toast } from 'sonner'
import { CATEGORIES, CATEGORY_BY_ID } from '@shared/catalog'
import { normalizeText } from '@shared/text'
import type { CategoryId, Expense, MonthKey } from '@shared/types'
import { useSession } from '@/app/session'
import { CategoryTile } from '@/components/common/CategoryTile'
import { ChartTooltipBox } from '@/components/common/ChartCard'
import { EmptyState, EmptyStateCard } from '@/components/common/EmptyState'
import { Money } from '@/components/common/Money'
import { MonthPicker } from '@/components/common/MonthPicker'
import { ResponsiveModal } from '@/components/common/ResponsiveModal'
import { SegmentedControl, type SegmentOption } from '@/components/common/SegmentedControl'
import { Button } from '@/components/ui/button'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMonthExpenses } from '@/data/expenses'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { expensesToCsv, saveFile } from '@/lib/csv'
import { dayKey, formatDayLabel, formatMonth, formatMoney, formatPercent } from '@/lib/format'
import { useExpenseComposer } from './ExpenseComposer'
import { ExpenseRow } from './ExpenseRow'
import { CategoryPicker, FieldLabel } from './fields'
import { necessaryBreakdown } from './necessaryBreakdown'

type NecessaryFilter = 'all' | 'yes' | 'no'

interface DayGroup {
  key: string
  date: Date
  total: number
  items: Expense[]
}

function groupByDay(expenses: Expense[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const expense of expenses) {
    const key = dayKey(expense.date)
    const last = groups[groups.length - 1]
    if (last?.key === key) {
      last.items.push(expense)
      last.total += expense.amountARS
    } else {
      groups.push({ key, date: expense.date, total: expense.amountARS, items: [expense] })
    }
  }
  return groups
}

const FILTER_TRIGGER = 'paper h-11 w-auto min-w-0 shrink-0 gap-2 rounded-full border px-4 text-sm'

const NECESSARY_OPTIONS: SegmentOption<NecessaryFilter>[] = [
  { value: 'all', label: 'Todos' },
  { value: 'yes', label: 'Necesarios' },
  { value: 'no', label: 'No necesarios' },
]

const NECESSARY_COLOR = 'var(--chart-1)'
const UNNECESSARY_COLOR = 'var(--chart-2)'
const necessaryChartConfig = {} satisfies ChartConfig

interface BreakdownItem {
  key: 'necessary' | 'unnecessary'
  label: string
  value: number
  percentage: number
  color: string
}

function BreakdownLegend({ items, className }: { items: BreakdownItem[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.key} className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: item.color }} />
          <span className="min-w-0 flex-1 text-xs text-muted-foreground">{item.label}</span>
          <span className="shrink-0 text-xs font-semibold tabular-nums">{formatPercent(item.percentage, 0)}</span>
          <Money value={item.value} tabular className="shrink-0 text-sm font-semibold" />
        </li>
      ))}
    </ul>
  )
}

function NecessaryPie({ items, total }: { items: BreakdownItem[]; total: number }) {
  if (total === 0) return <div aria-label="Sin gastos visibles" className="size-28 shrink-0 rounded-full bg-foreground/[0.08]" />

  return (
    <ChartContainer config={necessaryChartConfig} className="size-28 shrink-0 aspect-auto" aria-label="Proporción de gastos necesarios y no necesarios">
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <ChartTooltip
          content={({ active, payload }) => {
            const item = payload?.[0]?.payload as BreakdownItem | undefined
            if (!active || !item) return null
            return (
              <ChartTooltipBox
                title={item.label}
                rows={[
                  { label: 'Monto', value: formatMoney(item.value), color: item.color },
                  { label: 'Del total', value: formatPercent(item.percentage, 0) },
                ]}
              />
            )
          }}
        />
        <Pie
          data={items}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius="92%"
          paddingAngle={2}
          startAngle={90}
          endAngle={-270}
          stroke="var(--ink)"
          strokeWidth={2}
          isAnimationActive
          animationDuration={800}
        >
          {items.map((item) => (
            <Cell key={item.key} fill={item.color} className="cursor-default outline-none" />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

function exportCsv(month: MonthKey, expenses: Expense[]) {
  saveFile(`penny-gastos-${month}.csv`, expensesToCsv(expenses)).catch((error: Error) =>
    toast.error('No se pudo exportar', { description: error.message }),
  )
}

function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative min-w-0 flex-1 lg:min-w-64">
      <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Buscar gastos" className="rounded-full pl-10" />
    </div>
  )
}

function ActiveFilterChip({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border-2 border-ink-stamp bg-penny pr-2 pl-3 text-xs font-semibold text-ink-stamp"
    >
      {children}
      <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2.4} />
      <span className="sr-only">Quitar filtro</span>
    </button>
  )
}

export function MovementsTab({ month, onMonthChange }: { month: MonthKey; onMonthChange: (month: MonthKey) => void }) {
  const { uid } = useSession()
  const composer = useExpenseComposer()
  const desktop = useIsDesktop()
  const { data: expenses, loading } = useMonthExpenses(uid, month)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [necessary, setNecessary] = useState<NecessaryFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    const query = normalizeText(search)
    return expenses.filter(
      (expense) =>
        (category === 'all' || expense.category === category) &&
        (necessary === 'all' || expense.necessary === (necessary === 'yes')) &&
        (!query ||
          normalizeText(expense.description).includes(query) ||
          normalizeText(CATEGORY_BY_ID[expense.category]?.label ?? '').includes(query)),
    )
  }, [expenses, search, category, necessary])

  const groups = useMemo(() => groupByDay(filtered), [filtered])
  const breakdown = useMemo(() => necessaryBreakdown(filtered), [filtered])
  const { total, necessary: necessaryAmount, unnecessary, necessaryPct, unnecessaryPct } = breakdown
  const breakdownItems: BreakdownItem[] = [
    { key: 'necessary', label: 'Necesarios', value: necessaryAmount, percentage: necessaryPct, color: NECESSARY_COLOR },
    { key: 'unnecessary', label: 'No necesarios', value: unnecessary, percentage: unnecessaryPct, color: UNNECESSARY_COLOR },
  ]
  const activeFilters = (category !== 'all' ? 1 : 0) + (necessary !== 'all' ? 1 : 0)
  const hasFilters = Boolean(search) || activeFilters > 0
  const countLabel = `${filtered.length} ${filtered.length === 1 ? 'gasto' : 'gastos'}`

  function clearFilters() {
    setSearch('')
    setCategory('all')
    setNecessary('all')
  }

  // With nothing loaded for the month, totals reading $0 and filters with nothing to filter
  // are noise in front of the one thing to do, so the empty state gets the panel to itself.
  const blank = !loading && expenses.length === 0

  return (
    <div className="flex flex-1 flex-col space-y-5">
      {!desktop && blank && <MonthPicker month={month} onChange={onMonthChange} className="self-center" />}

      {!blank && desktop && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="paper-flat rounded-3xl p-4 md:p-5">
              <p className="text-xs text-muted-foreground">
                {hasFilters ? 'Total filtrado' : 'Total del mes'} · {countLabel}
              </p>
              <Money value={total} animated className="mt-1 text-2xl font-semibold md:text-3xl" />
            </div>
            <div className="paper-flat flex min-w-0 flex-col items-center gap-4 rounded-3xl p-4 lg:flex-row md:p-5">
              <NecessaryPie items={breakdownItems} total={total} />
              <div className="w-full min-w-0 flex-1">
                <p className="mb-2 text-xs text-muted-foreground">Proporción del gasto</p>
                <BreakdownLegend items={breakdownItems} className="space-y-2" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchField value={search} onChange={setSearch} />
            <div className="-mx-4 -mb-1.5 flex items-center gap-2 overflow-x-auto px-4 pb-1.5 [scrollbar-width:none] lg:mx-0 lg:min-w-0 lg:pl-0 lg:pr-1.5">
              <Select value={category} onValueChange={(value) => setCategory(value as CategoryId | 'all')}>
                <SelectTrigger className={FILTER_TRIGGER} aria-label="Filtrar por categoría">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="flex items-center gap-2">
                        <CategoryTile category={item.id} size="sm" />
                        {item.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <SegmentedControl<NecessaryFilter> className="h-11 shrink-0" value={necessary} onChange={setNecessary} options={NECESSARY_OPTIONS} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0 rounded-full"
                    disabled={filtered.length === 0}
                    onClick={() => exportCsv(month, filtered)}
                    aria-label="Exportar CSV"
                  >
                    <HugeiconsIcon icon={Download04Icon} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar CSV</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </>
      )}

      {!blank && !desktop && (
        <>
          {/* One card owns the month, its total, and how the visible spending is split. */}
          <section className="paper-flat rounded-3xl p-1.5 pb-4">
            <MonthPicker bare month={month} onChange={onMonthChange} className="flex w-full" />
            <div className="mx-3.5 mt-1.5 border-t-2 border-dashed border-foreground/15 pt-3.5">
              <p className="text-xs text-muted-foreground">
                {hasFilters ? 'Total filtrado' : 'Total del mes'} · {countLabel}
              </p>
              <Money value={total} animated className="mt-0.5 text-4xl font-semibold tracking-tight" />
              <div className="mt-3.5 flex h-2 overflow-hidden rounded-full bg-foreground/[0.08]" aria-label="Proporción de gastos necesarios y no necesarios">
                {total > 0 && (
                  <>
                    <div className="h-full bg-(--chart-1) transition-[width] duration-500" style={{ width: `${necessaryPct}%` }} />
                    <div className="h-full bg-(--chart-2) transition-[width] duration-500" style={{ width: `${unnecessaryPct}%` }} />
                  </>
                )}
              </div>
              <BreakdownLegend items={breakdownItems} className="mt-2.5 space-y-1.5" />
            </div>
          </section>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <SearchField value={search} onChange={setSearch} />
              <Button
                variant="outline"
                size="icon"
                className="relative size-11 shrink-0 rounded-full"
                onClick={() => setFiltersOpen(true)}
                aria-label={activeFilters ? `Filtros (${activeFilters} activos)` : 'Filtros'}
              >
                <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} />
                {activeFilters > 0 && (
                  <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-ink-stamp bg-penny text-[10px] font-bold text-ink-stamp tabular-nums">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </div>
            {activeFilters > 0 && (
              <div className="flex flex-wrap gap-2">
                {category !== 'all' && <ActiveFilterChip onRemove={() => setCategory('all')}>{CATEGORY_BY_ID[category].label}</ActiveFilterChip>}
                {necessary !== 'all' && (
                  <ActiveFilterChip onRemove={() => setNecessary('all')}>{necessary === 'yes' ? 'Necesarios' : 'No necesarios'}</ActiveFilterChip>
                )}
              </div>
            )}
          </div>

          <ResponsiveModal
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title="Filtros"
            footer={
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={activeFilters === 0}
                  onClick={() => {
                    setCategory('all')
                    setNecessary('all')
                  }}
                >
                  Limpiar
                </Button>
                <Button size="lg" className="flex-1" onClick={() => setFiltersOpen(false)}>
                  Ver {countLabel}
                </Button>
              </div>
            }
          >
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-baseline justify-between">
                  <FieldLabel>Categoría</FieldLabel>
                  {category !== 'all' && (
                    <button type="button" className="mb-2 text-xs font-medium text-muted-foreground underline underline-offset-2" onClick={() => setCategory('all')}>
                      Todas
                    </button>
                  )}
                </div>
                <CategoryPicker
                  value={category === 'all' ? null : category}
                  onChange={(next) => setCategory(next === category ? 'all' : next)}
                />
              </div>
              <div>
                <FieldLabel>¿Eran necesarios?</FieldLabel>
                <SegmentedControl<NecessaryFilter> stretch value={necessary} onChange={setNecessary} options={NECESSARY_OPTIONS} />
              </div>
              <div>
                <FieldLabel>Exportar</FieldLabel>
                <Button variant="outline" className="w-full rounded-full" disabled={filtered.length === 0} onClick={() => exportCsv(month, filtered)}>
                  <HugeiconsIcon icon={Download04Icon} />
                  Descargar CSV · {countLabel}
                </Button>
              </div>
            </div>
          </ResponsiveModal>
        </>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyStateCard>
          {hasFilters ? (
            <EmptyState
              pose="surprise"
              title="Nada por acá"
              description="Ningún gasto coincide con los filtros."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              pose="sunglasses"
              title={`Sin gastos en ${formatMonth(month, { year: false }).toLowerCase()}`}
              description="Cargá tu primer gasto desde acá o mandalo desde tu Atajo de iOS."
              action={<Button onClick={() => composer.open()}>Nuevo gasto</Button>}
            />
          )}
        </EmptyStateCard>
      ) : (
        <div className="space-y-5">
          {groups.map((group, groupIndex) => (
            <section key={group.key}>
              <div className="mb-2 flex items-baseline justify-between px-2">
                <h3 className="text-sm font-medium">{formatDayLabel(group.date)}</h3>
                <Money value={group.total} className="text-xs text-muted-foreground" />
              </div>
              <div className="paper-flat divide-y divide-border overflow-hidden rounded-3xl">
                {group.items.map((expense, index) => (
                  <ExpenseRow key={expense.id} expense={expense} index={groupIndex + index} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
