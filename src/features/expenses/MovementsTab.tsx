import { Download04Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useMemo, useState } from 'react'
import { CATEGORIES, CATEGORY_BY_ID } from '@shared/catalog'
import { sum } from '@shared/money'
import { normalizeText } from '@shared/text'
import type { CategoryId, Expense, MonthKey } from '@shared/types'
import { useSession } from '@/app/session'
import { CategoryTile } from '@/components/common/CategoryTile'
import { EmptyState } from '@/components/common/EmptyState'
import { Money } from '@/components/common/Money'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMonthExpenses } from '@/data/expenses'
import { downloadFile, expensesToCsv } from '@/lib/csv'
import { dayKey, formatDayLabel, formatMonth } from '@/lib/format'
import { useExpenseComposer } from './ExpenseComposer'
import { ExpenseRow } from './ExpenseRow'

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

export function MovementsTab({ month }: { month: MonthKey }) {
  const { uid } = useSession()
  const composer = useExpenseComposer()
  const { data: expenses, loading } = useMonthExpenses(uid, month)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [necessary, setNecessary] = useState<NecessaryFilter>('all')

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
  const total = sum(filtered.map((expense) => expense.amountARS))
  const unnecessary = sum(filtered.filter((expense) => !expense.necessary).map((expense) => expense.amountARS))
  const hasFilters = Boolean(search) || category !== 'all' || necessary !== 'all'

  function clearFilters() {
    setSearch('')
    setCategory('all')
    setNecessary('all')
  }

  // With nothing loaded for the month, totals reading $0 and filters with nothing to filter
  // are noise in front of the one thing to do, so the empty state gets the panel to itself.
  const blank = !loading && expenses.length === 0

  return (
    <div className="space-y-5">
      {!blank && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="paper rounded-3xl p-4 md:p-5">
              <p className="text-xs text-muted-foreground">
                {hasFilters ? 'Total filtrado' : 'Total del mes'} · {filtered.length} {filtered.length === 1 ? 'gasto' : 'gastos'}
              </p>
              <Money value={total} animated className="mt-1 text-2xl font-semibold md:text-3xl" />
            </div>
            <div className="paper rounded-3xl p-4 md:p-5">
              <p className="text-xs text-muted-foreground">No necesarios</p>
              <Money value={unnecessary} animated className="mt-1 text-2xl font-semibold md:text-3xl" />
              {total > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{Math.round((unnecessary / total) * 100)}% del total</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1 lg:min-w-64">
              <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar gastos" className="paper rounded-full pl-10" />
            </div>
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
              <SegmentedControl<NecessaryFilter>
                className="h-11 shrink-0"
                value={necessary}
                onChange={setNecessary}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'yes', label: 'Necesarios' },
                  { value: 'no', label: 'No necesarios' },
                ]}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0 rounded-full"
                    disabled={filtered.length === 0}
                    onClick={() => downloadFile(`penny-gastos-${month}.csv`, expensesToCsv(filtered))}
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

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="paper rounded-4xl">
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
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group, groupIndex) => (
            <section key={group.key}>
              <div className="mb-2 flex items-baseline justify-between px-2">
                <h3 className="text-sm font-medium">{formatDayLabel(group.date)}</h3>
                <Money value={group.total} className="text-xs text-muted-foreground" />
              </div>
              <div className="paper divide-y divide-border overflow-hidden rounded-3xl">
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
