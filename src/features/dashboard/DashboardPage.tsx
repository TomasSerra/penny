import { motion } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { monthKeyOf, monthsBetween, parseMonthKey } from '@shared/dates'
import { sum } from '@shared/money'
import { computePace } from '@shared/pace'
import { rateLabel } from '@shared/rates'
import type { Currency } from '@shared/types'
import { useSession } from '@/app/session'
import { Money } from '@/components/common/Money'
import { MonthPicker } from '@/components/common/MonthPicker'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useExpensesBetween } from '@/data/expenses'
import { AllocationBar, AllocationLegend } from '@/features/budget/allocation'
import { useBudgetSummary } from '@/features/budget/useBudgetSummary'
import { CurrencyToggle } from '@/features/expenses/fields'
import { OnboardingCard } from '@/features/onboarding/OnboardingCard'
import { useOnboarding } from '@/features/onboarding/OnboardingProvider'
import { useDisplayName } from '@/components/layout/UserMenu'
import { useMonthParam } from '@/hooks/useMonthParam'
import { formatDate, formatMonth, formatMoney, formatShortMonth } from '@/lib/format'
import { CategoryBreakdown } from './CategoryBreakdown'
import { CumulativeChart, type CumulativeDatum } from './CumulativeChart'
import { MonthlyChart, type MonthlyDatum } from './MonthlyChart'
import { PaceHero, PaceHeroEmpty } from './PaceHero'

const CURRENCY_KEY = 'penny-display-currency'

function useDisplayCurrency(): [Currency, (currency: Currency) => void] {
  const [currency, setCurrency] = useState<Currency>(() => (localStorage.getItem(CURRENCY_KEY) === 'USD' ? 'USD' : 'ARS'))
  return [
    currency,
    (next) => {
      localStorage.setItem(CURRENCY_KEY, next)
      setCurrency(next)
    },
  ]
}

function Reveal({ children, index, className }: { children: ReactNode; index: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function greeting(hour: number) {
  if (hour < 6) return 'Buenas noches'
  if (hour < 13) return 'Buen día'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function DashboardPage() {
  const { uid } = useSession()
  const { needsSetup } = useOnboarding()
  const firstName = useDisplayName().split(' ')[0]
  const [month, setMonth] = useMonthParam()
  const [currency, setCurrency] = useDisplayCurrency()
  const { year } = parseMonthKey(month)
  const currentMonth = monthKeyOf(new Date())

  const { data: yearExpenses, loading: expensesLoading } = useExpensesBetween(uid, `${year}-01`, `${year}-12`)
  const { summary, rate, loading: budgetLoading } = useBudgetSummary(month)
  const rateValue = rate?.value ?? 0
  const convert = (ars: number) => (currency === 'USD' ? (rateValue ? ars / rateValue : 0) : ars)
  const amountOf = (expense: { amountARS: number; amountUSD: number }) => (currency === 'USD' ? expense.amountUSD : expense.amountARS)

  const monthExpenses = useMemo(() => yearExpenses.filter((expense) => expense.month === month), [yearExpenses, month])
  const spentARS = sum(monthExpenses.map((expense) => expense.amountARS))
  const pace = summary ? computePace({ budget: summary.variableARS, spent: spentARS, month, today: new Date() }) : null

  const months = monthsBetween(`${year}-01`, `${year}-12`)
  const monthly: MonthlyDatum[] = useMemo(
    () =>
      months.map((key) => {
        const items = yearExpenses.filter((expense) => expense.month === key)
        const necessary = sum(items.filter((expense) => expense.necessary).map(amountOf))
        const unnecessary = sum(items.filter((expense) => !expense.necessary).map(amountOf))
        return { key, label: formatShortMonth(key), necessary, unnecessary, total: necessary + unnecessary }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [yearExpenses, year, currency],
  )

  const cumulative: CumulativeDatum[] = useMemo(() => {
    let running = 0
    return monthly.map((item) => {
      running += item.total
      return { key: item.key, label: item.label, value: item.key <= currentMonth ? running : null }
    })
  }, [monthly, currentMonth])

  return (
    <>
      <PageHeader
        eyebrow={formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}
        title={`${greeting(Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())))}, ${firstName}`}
        actions={
          <>
            <MonthPicker month={month} onChange={setMonth} />
            <CurrencyToggle value={currency} onChange={setCurrency} size="md" />
          </>
        }
      />

      {needsSetup && pace && summary && <OnboardingCard className="mb-4" />}

      {/* Three columns only when there is real room next to the sidebar; below that, cards stack in pairs. */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Reveal index={0} className="md:col-span-2">
          {budgetLoading ? (
            <Skeleton className="h-72 rounded-4xl" />
          ) : pace && summary ? (
            <PaceHero pace={pace} currency={currency} convert={convert} />
          ) : needsSetup ? (
            // Same invitation as the banner: with nothing loaded yet, it is the whole hero.
            <OnboardingCard className="h-full" />
          ) : (
            <PaceHeroEmpty month={month} />
          )}
        </Reveal>

        <Reveal index={1} className="md:col-span-2 xl:col-span-1">
          <section className="paper flex h-full flex-col rounded-4xl p-6">
            <p className="text-sm text-muted-foreground">Ingreso neto</p>
            {summary ? (
              <>
                <Money value={convert(summary.netARS)} currency={currency} animated className="mt-1.5 font-display text-4xl" />
                <Money
                  value={currency === 'USD' ? summary.netARS : rateValue ? summary.netARS / rateValue : 0}
                  currency={currency === 'USD' ? 'ARS' : 'USD'}
                  className="text-sm text-muted-foreground"
                />
                <dl className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Ingresos</dt>
                    <dd>
                      <Money value={convert(summary.grossARS)} currency={currency} tabular />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Deducciones</dt>
                    <dd>
                      <Money value={-convert(summary.deductionsARS)} currency={currency} tabular />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Gastado en el mes</dt>
                    <dd>
                      <Money value={convert(spentARS)} currency={currency} tabular />
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              // Without a budget this card has no numbers to show, so it points at the one screen
              // that fills it in rather than stating the obvious and stopping there.
              <div className="mt-2 flex flex-1 flex-col items-start">
                <p className="text-sm text-balance text-muted-foreground">
                  Todavía no armaste el presupuesto de {formatMonth(month, { year: false }).toLowerCase()}. Con tus ingresos, gastos fijos y
                  ahorro cargados, acá vas a ver cuánto te queda libre.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to={`/presupuesto?mes=${month}`}>Armar presupuesto</Link>
                </Button>
              </div>
            )}
            {rate && (
              <p className="mt-auto pt-5 text-xs text-muted-foreground">
                Dólar {rateLabel(rate)} · {formatMoney(rate.value, 'ARS', { cents: !Number.isInteger(rate.value) })}
              </p>
            )}
          </section>
        </Reveal>

        {summary && (
          <Reveal index={2} className="md:col-span-2 xl:col-span-3">
            <section className="paper rounded-4xl p-5 md:p-6">
              <header className="mb-4">
                <h2 className="font-semibold">Distribución del mes</h2>
                <p className="text-sm text-muted-foreground">Cómo se reparte tu ingreso neto</p>
              </header>
              <AllocationBar summary={summary} className="mb-5" />
              <AllocationLegend summary={summary} currency={currency} rate={rateValue} />
            </section>
          </Reveal>
        )}

        <Reveal index={3} className="min-w-0 md:col-span-2">
          {expensesLoading ? <Skeleton className="h-80 rounded-4xl" /> : <MonthlyChart data={monthly} selected={month} currency={currency} onSelect={setMonth} />}
        </Reveal>

        <Reveal index={4} className="min-w-0">
          <CategoryBreakdown expenses={monthExpenses} currency={currency} />
        </Reveal>

        <Reveal index={5} className="min-w-0 md:col-span-2 xl:col-span-3">
          {expensesLoading ? <Skeleton className="h-72 rounded-4xl" /> : <CumulativeChart data={cumulative} currency={currency} year={year} />}
        </Reveal>
      </div>
    </>
  )
}
