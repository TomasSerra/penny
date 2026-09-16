import { Add01Icon, Alert02Icon, Copy01Icon, Delete02Icon, RepeatIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { computeBudget, copyBudget, emptyBudget } from '@shared/budget'
import type { SubscriptionCharge } from '@shared/expenses'
import { rateLabel } from '@shared/rates'
import { sum, toARS } from '@shared/money'
import type { Budget, MoneyItem, RateSnapshot } from '@shared/types'
import { useSession } from '@/app/session'
import { EmptyState, EmptyStateCard } from '@/components/common/EmptyState'
import { Money } from '@/components/common/Money'
import { MonthPicker } from '@/components/common/MonthPicker'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { saveBudget, usePreviousBudget } from '@/data/budgets'
import { CurrencyToggle, MoneyInput } from '@/features/expenses/fields'
import { useMonthParam } from '@/hooks/useMonthParam'
import { formatMoney, formatMonth, formatPercent } from '@/lib/format'
import { AllocationBar, AllocationLegend } from './allocation'
import { useBudgetSummary } from './useBudgetSummary'

type ListKey = 'incomes' | 'deductions' | 'fixedExpenses'

const newItem = (name = ''): MoneyItem => ({ id: crypto.randomUUID(), name, amount: 0, currency: 'ARS' })

function ItemsSection({
  title,
  description,
  items,
  onChange,
  placeholder,
  rate,
  index,
  extraTotal = 0,
  children,
}: {
  title: string
  description: string
  items: MoneyItem[]
  onChange: (items: MoneyItem[]) => void
  placeholder: string
  rate: number
  index: number
  /** Amount of the read-only rows passed as children */
  extraTotal?: number
  children?: ReactNode
}) {
  const total = sum(items.map((item) => toARS(item.amount, item.currency, rate))) + extraTotal
  const update = (id: string, patch: Partial<MoneyItem>) => onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="paper @container rounded-4xl p-5 md:p-6"
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Money value={total} className="text-lg font-semibold" />
      </header>

      <div>
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="-mx-1 -mb-1.5 overflow-hidden px-1 pb-1.5"
            >
              {/* Sized by the card, not the viewport: the column is narrow next to the sidebar and summary. */}
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1.5 @lg:grid-cols-[minmax(0,1fr)_11rem_auto]">
                <Input
                  value={item.name}
                  onChange={(event) => update(item.id, { name: event.target.value })}
                  placeholder={placeholder}
                  aria-label="Nombre"
                  className="col-span-2 @lg:col-span-1"
                />
                <MoneyInput value={item.amount} currency={item.currency} onChange={(amount) => update(item.id, { amount })} ariaLabel={`Monto de ${item.name || title}`} />
                <div className="flex items-center gap-1">
                  <CurrencyToggle value={item.currency} onChange={(currency) => update(item.id, { currency })} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => onChange(items.filter((other) => other.id !== item.id))}
                    aria-label="Quitar"
                  >
                    <HugeiconsIcon icon={Delete02Icon} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Button variant="ghost" size="sm" className="mt-2 text-penny-ink" onClick={() => onChange([...items, newItem()])}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} />
        Agregar
      </Button>
      {children}
    </motion.section>
  )
}

function SubscriptionCharges({ charges }: { charges: SubscriptionCharge[] }) {
  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">Suscripciones del mes</h3>
        <Link to="/gastos?tab=suscripciones" className="text-xs text-penny-ink hover:underline">
          Administrar
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {charges.map((charge) => (
          <li key={charge.subscriptionId} className="flex items-center gap-3 py-2 text-sm">
            <HugeiconsIcon icon={RepeatIcon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
            <span className="min-w-0 flex-1 truncate">{charge.name}</span>
            {charge.projected && <span className="shrink-0 text-xs text-muted-foreground">Estimado</span>}
            <span className="flex shrink-0 flex-col items-end">
              <Money value={charge.amountARS} tabular className="font-medium" />
              {charge.currency === 'USD' && (
                <Money value={charge.amount} currency="USD" cents={!Number.isInteger(charge.amount)} className="text-xs text-muted-foreground" />
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SavingsRow({ label, value, onChange, amount }: { label: string; value: number; onChange: (value: number) => void; amount: number }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm">
          <span className="font-semibold tabular-nums">{value}%</span>
          <span className="ml-2 text-muted-foreground">{formatMoney(amount)}</span>
        </span>
      </div>
      <Slider value={[value]} min={0} max={100} step={1} onValueChange={([next]) => onChange(next)} aria-label={label} />
    </div>
  )
}

function BudgetEditor({
  initial,
  rate,
  freezeRate,
  subscriptionCharges,
}: {
  initial: Budget
  rate: RateSnapshot | undefined
  freezeRate: boolean
  subscriptionCharges: SubscriptionCharge[]
}) {
  const { uid } = useSession()
  const [draft, setDraft] = useState(initial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const pending = useRef<Budget | null>(null)
  const firstRender = useRef(true)

  const flush = useCallback(() => {
    const budget = pending.current
    if (!budget) return
    pending.current = null
    saveBudget(uid, budget).catch((error: Error) => toast.error('No se pudo guardar el presupuesto', { description: error.message }))
    setStatus('saved')
  }, [uid])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    // The current month keeps the latest quote; past months keep the one they closed with.
    pending.current = !freezeRate && rate ? { ...draft, rateSnapshot: rate } : draft
    setStatus('saving')
    const timeout = setTimeout(flush, 700)
    return () => clearTimeout(timeout)
  }, [draft, rate, freezeRate, flush])

  useEffect(() => () => flush(), [flush])

  const rateValue = rate?.value ?? 0
  const subscriptionsARS = sum(subscriptionCharges.map((charge) => charge.amountARS))
  const summary = computeBudget(draft, rateValue, subscriptionsARS)
  const setList = (key: ListKey) => (items: MoneyItem[]) => setDraft((previous) => ({ ...previous, [key]: items }))

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-4">
        <ItemsSection index={0} title="Ingresos" description="Sueldo, freelance y todo lo que entra por mes." placeholder="Sueldo" items={draft.incomes} onChange={setList('incomes')} rate={rateValue} />
        <ItemsSection index={1} title="Deducciones" description="Monotributo, impuestos o aportes que se descuentan." placeholder="Monotributo" items={draft.deductions} onChange={setList('deductions')} rate={rateValue} />
        <ItemsSection
          index={2}
          title="Gastos fijos"
          description="Lo que ya sabés que vas a pagar, suscripciones incluidas. Se reserva del neto."
          placeholder="Seguro del auto"
          items={draft.fixedExpenses}
          onChange={setList('fixedExpenses')}
          rate={rateValue}
          extraTotal={subscriptionsARS}
        >
          {subscriptionCharges.length > 0 && <SubscriptionCharges charges={subscriptionCharges} />}
        </ItemsSection>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="paper rounded-4xl p-5 md:p-6"
        >
          <header className="mb-5">
            <h2 className="font-semibold">Ahorro</h2>
            <p className="text-sm text-muted-foreground">Porcentaje del ingreso neto. Lo que sobra queda para gastos variables.</p>
          </header>
          <div className="flex flex-col gap-6">
            <SavingsRow
              label="Corto plazo"
              value={draft.savings.shortTermPct}
              amount={summary.shortTermARS}
              onChange={(shortTermPct) => setDraft((previous) => ({ ...previous, savings: { ...previous.savings, shortTermPct } }))}
            />
            <SavingsRow
              label="Largo plazo"
              value={draft.savings.longTermPct}
              amount={summary.longTermARS}
              onChange={(longTermPct) => setDraft((previous) => ({ ...previous, savings: { ...previous.savings, longTermPct } }))}
            />
          </div>
        </motion.section>
      </div>

      <aside className="paper flex flex-col gap-5 rounded-4xl p-5 md:p-6 lg:sticky lg:top-10">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Ingreso neto</span>
          <AnimatePresence mode="wait">
            <motion.span key={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {status === 'saving' ? 'Guardando…' : status === 'saved' ? 'Guardado' : ''}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="-mt-3">
          <Money value={summary.netARS} animated fromZero={false} className="text-4xl font-semibold tracking-tight" />
          {rateValue > 0 && <Money value={summary.netARS / rateValue} currency="USD" className="block text-sm text-muted-foreground" />}
        </div>

        <AllocationBar summary={summary} />
        <AllocationLegend summary={summary} rate={rateValue} layout="list" />

        {summary.overAllocated && (
          <p className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
            <HugeiconsIcon icon={Alert02Icon} className="mt-0.5 size-4 shrink-0" />
            Los gastos fijos y el ahorro superan tu ingreso neto por {formatMoney(-summary.variableARS)}.
          </p>
        )}

        {rate && (
          <p className="rounded-2xl bg-foreground/[0.035] px-3.5 py-2.5 text-xs text-muted-foreground dark:bg-white/[0.04]">
            Dólar {rateLabel(rate)} a {formatMoney(rate.value, 'ARS', { cents: !Number.isInteger(rate.value) })}
            {freezeRate ? ' · cotización guardada del mes' : ' · en vivo'}
            <span className="block">Variables: {formatPercent(summary.pct.variable)} del neto</span>
          </p>
        )}
      </aside>
    </div>
  )
}

export default function BudgetPage() {
  const [month, setMonth] = useMonthParam()
  const { uid, rate: liveRate } = useSession()
  const { budget, loading, rate, isPast, subscriptionCharges } = useBudgetSummary(month)
  const { data: previous } = usePreviousBudget(uid, month)

  function create(source?: Budget | null) {
    const next = source ? copyBudget(source, month) : { ...emptyBudget(month), incomes: [newItem('Sueldo')] }
    saveBudget(uid, liveRate ? { ...next, rateSnapshot: liveRate } : next).catch((error: Error) =>
      toast.error('No se pudo crear el presupuesto', { description: error.message }),
    )
  }

  return (
    <>
      <PageHeader title="Presupuesto" eyebrow="Cuánto entra y cómo lo repartís" actions={<MonthPicker month={month} onChange={setMonth} />} />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-72 rounded-4xl" />
          <Skeleton className="h-72 rounded-4xl" />
        </div>
      ) : budget ? (
        <BudgetEditor key={month} initial={budget} rate={rate} freezeRate={isPast} subscriptionCharges={subscriptionCharges} />
      ) : (
        <EmptyStateCard>
          <EmptyState
            pose="rock"
            title={`Armá el presupuesto de ${formatMonth(month, { year: false }).toLowerCase()}`}
            description="Cargá tus ingresos, gastos fijos y cuánto querés ahorrar. Penny calcula cuánto te queda para gastar."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                {previous && (
                  <Button onClick={() => create(previous)}>
                    <HugeiconsIcon icon={Copy01Icon} />
                    Copiar de {formatMonth(previous.month, { year: false }).toLowerCase()}
                  </Button>
                )}
                <Button variant={previous ? 'outline' : 'default'} onClick={() => create()}>
                  Empezar de cero
                </Button>
              </div>
            }
          />
        </EmptyStateCard>
      )}
    </>
  )
}
