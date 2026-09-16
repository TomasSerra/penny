import { addMonths } from './dates.js'
import { round2 } from './money.js'
import type { MonthKey } from './types.js'

export interface InstallmentSlice {
  number: number
  month: MonthKey
  amount: number
}

export function splitInstallments(totalAmount: number, count: number, firstMonth: MonthKey): InstallmentSlice[] {
  const base = Math.floor((totalAmount / count) * 100) / 100
  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    month: addMonths(firstMonth, index),
    amount: index === count - 1 ? round2(totalAmount - base * (count - 1)) : base,
  }))
}
