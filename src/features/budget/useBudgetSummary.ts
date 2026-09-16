import { useMemo } from 'react'
import { computeBudget, copyBudget } from '@shared/budget'
import { monthKeyOf } from '@shared/dates'
import { subscriptionChargesForMonth } from '@shared/expenses'
import { sum } from '@shared/money'
import type { MonthKey } from '@shared/types'
import { useSession } from '@/app/session'
import { useBudget, usePreviousBudget } from '@/data/budgets'
import { useMonthExpenses } from '@/data/expenses'
import { useSubscriptions } from '@/data/subscriptions'

/**
 * Budget for a month plus its computed summary. The current and future months
 * use the live quote; past months use the quote frozen when they were last saved.
 * Subscription charges of the month count as fixed expenses.
 *
 * A month without its own budget shows the most recent one before it (`inheritedFrom`).
 * The session copies it into the current month on open; future months stay a preview.
 */
export function useBudgetSummary(month: MonthKey) {
  const { uid, rate: liveRate } = useSession()
  const { data: own, loading: ownLoading } = useBudget(uid, month)
  const { data: previous, loading: previousLoading } = usePreviousBudget(uid, month)
  const budget = useMemo(() => own ?? (previous ? copyBudget(previous, month) : null), [own, previous, month])
  const inheritedFrom = !own && previous ? previous.month : null
  const loading = ownLoading || (!own && previousLoading)
  const { data: subscriptions } = useSubscriptions(uid)
  const { data: monthExpenses } = useMonthExpenses(uid, month)
  const isPast = month < monthKeyOf(new Date())
  const rate = isPast ? (budget?.rateSnapshot ?? liveRate) : liveRate

  const subscriptionCharges = useMemo(
    () => (rate ? subscriptionChargesForMonth(subscriptions, monthExpenses, month, rate.value) : []),
    [subscriptions, monthExpenses, month, rate],
  )
  const summary = useMemo(
    () => (budget && rate ? computeBudget(budget, rate.value, sum(subscriptionCharges.map((charge) => charge.amountARS))) : null),
    [budget, rate, subscriptionCharges],
  )

  return { budget, inheritedFrom, loading, summary, rate, isPast, subscriptionCharges }
}
