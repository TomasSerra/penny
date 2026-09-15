import { calendarParts, daysInMonth, monthKeyOf, parseMonthKey } from './dates.js'
import type { MonthKey } from './types.js'

export type PaceStatus = 'ok' | 'warning' | 'over'
export type PacePeriod = 'past' | 'current' | 'future'

export interface Pace {
  budget: number
  spent: number
  remaining: number
  /** spent / budget, can exceed 1 */
  progress: number
  daysInMonth: number
  daysElapsed: number
  /** Days left including today */
  daysLeft: number
  /** How much can be spent per remaining day; null once the month is over */
  dailyAllowance: number | null
  averageDaily: number
  projected: number
  status: PaceStatus
  period: PacePeriod
}

/** Projections are too noisy during the first days of the month to warn about. */
const MIN_DAYS_FOR_WARNING = 5

export function computePace(params: { budget: number; spent: number; month: MonthKey; today: Date }): Pace {
  const { budget, spent, month, today } = params
  const { year, month: monthNumber } = parseMonthKey(month)
  const totalDays = daysInMonth(year, monthNumber)
  const currentMonth = monthKeyOf(today)
  const period: PacePeriod = month < currentMonth ? 'past' : month > currentMonth ? 'future' : 'current'

  const daysElapsed = period === 'past' ? totalDays : period === 'future' ? 0 : calendarParts(today).day
  const daysLeft = totalDays - daysElapsed + (period === 'current' ? 1 : 0)
  const remaining = budget - spent
  const averageDaily = daysElapsed > 0 ? spent / daysElapsed : 0
  const projected = period === 'current' ? averageDaily * totalDays : spent
  const dailyAllowance = daysLeft > 0 ? Math.max(remaining, 0) / daysLeft : null

  let status: PaceStatus = 'ok'
  if (spent > budget && spent > 0) status = 'over'
  else if (period === 'current' && daysElapsed >= MIN_DAYS_FOR_WARNING && projected > budget) status = 'warning'

  return {
    budget,
    spent,
    remaining,
    progress: budget > 0 ? spent / budget : spent > 0 ? 1 : 0,
    daysInMonth: totalDays,
    daysElapsed,
    daysLeft,
    dailyAllowance,
    averageDaily,
    projected,
    status,
    period,
  }
}
