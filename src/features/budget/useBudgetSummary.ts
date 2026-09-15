import { useMemo } from 'react'
import { computeBudget } from '@shared/budget'
import { monthKeyOf } from '@shared/dates'
import type { MonthKey } from '@shared/types'
import { useSession } from '@/app/session'
import { useBudget } from '@/data/budgets'

/**
 * Budget for a month plus its computed summary. The current and future months
 * use the live quote; past months use the quote frozen when they were last saved.
 */
export function useBudgetSummary(month: MonthKey) {
  const { uid, rate: liveRate } = useSession()
  const { data: budget, loading } = useBudget(uid, month)
  const isPast = month < monthKeyOf(new Date())
  const rate = isPast ? (budget?.rateSnapshot ?? liveRate) : liveRate

  const summary = useMemo(() => (budget && rate ? computeBudget(budget, rate.value) : null), [budget, rate])

  return { budget, loading, summary, rate, isPast }
}
