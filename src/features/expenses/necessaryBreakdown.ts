import { sum } from '@shared/money'
import type { Expense } from '@shared/types'

export interface NecessaryBreakdown {
  total: number
  necessary: number
  unnecessary: number
  necessaryPct: number
  unnecessaryPct: number
}

/**
 * Summarizes exactly the expenses currently in view. Percentages are paired so
 * rounding can never make the visual total add up to 99% or 101%.
 */
export function necessaryBreakdown(expenses: Expense[]): NecessaryBreakdown {
  const necessary = sum(expenses.filter((expense) => expense.necessary).map((expense) => expense.amountARS))
  const unnecessary = sum(expenses.filter((expense) => !expense.necessary).map((expense) => expense.amountARS))
  const total = necessary + unnecessary
  const unnecessaryPct = total > 0 ? Math.round((unnecessary / total) * 100) : 0

  return {
    total,
    necessary,
    unnecessary,
    necessaryPct: total > 0 ? 100 - unnecessaryPct : 0,
    unnecessaryPct,
  }
}
