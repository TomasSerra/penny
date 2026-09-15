import { addMonths, calendarParts, daysInMonth, toMonthKey } from './dates.js'
import { round2 } from './money.js'
import type { MonthKey } from './types.js'

/**
 * Month of the card statement that includes a purchase. Purchases up to (and
 * including) the closing day land in that month's statement; later ones roll
 * over to the next. Closing days beyond the month length clamp to its last day.
 */
export function statementMonth(date: Date, closingDay: number): MonthKey {
  const { year, month, day } = calendarParts(date)
  const closing = Math.min(closingDay, daysInMonth(year, month))
  const key = toMonthKey(year, month)
  return day <= closing ? key : addMonths(key, 1)
}

export interface InstallmentSlice {
  number: number
  month: MonthKey
  amount: number
}

export function splitInstallments(
  totalAmount: number,
  count: number,
  purchaseDate: Date,
  closingDay: number,
): InstallmentSlice[] {
  const first = statementMonth(purchaseDate, closingDay)
  const base = Math.floor((totalAmount / count) * 100) / 100
  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    month: addMonths(first, index),
    amount: index === count - 1 ? round2(totalAmount - base * (count - 1)) : base,
  }))
}
