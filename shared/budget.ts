import { sum, toARS } from './money.js'
import type { Budget, MoneyItem, MonthKey } from './types.js'

export type BudgetInput = Pick<Budget, 'incomes' | 'deductions' | 'fixedExpenses' | 'savings'>

export interface BudgetSummary {
  rate: number
  grossARS: number
  deductionsARS: number
  netARS: number
  fixedARS: number
  shortTermARS: number
  longTermARS: number
  /** Whatever is left after fixed expenses and savings */
  variableARS: number
  /** Percentages (0-100) relative to net income */
  pct: { fixed: number; variable: number; shortTerm: number; longTerm: number }
  overAllocated: boolean
}

function totalARS(items: MoneyItem[], rate: number): number {
  return sum(items.map((item) => toARS(item.amount, item.currency, rate)))
}

/**
 * Mirrors the original spreadsheet: savings are a % of net income and
 * variable spending is the remainder after fixed expenses and savings.
 */
export function computeBudget(budget: BudgetInput, rate: number): BudgetSummary {
  const grossARS = totalARS(budget.incomes, rate)
  const deductionsARS = totalARS(budget.deductions, rate)
  const netARS = grossARS - deductionsARS
  const fixedARS = totalARS(budget.fixedExpenses, rate)
  const shortTermARS = (netARS * budget.savings.shortTermPct) / 100
  const longTermARS = (netARS * budget.savings.longTermPct) / 100
  const variableARS = netARS - fixedARS - shortTermARS - longTermARS
  const pctOf = (value: number) => (netARS > 0 ? (value / netARS) * 100 : 0)

  return {
    rate,
    grossARS,
    deductionsARS,
    netARS,
    fixedARS,
    shortTermARS,
    longTermARS,
    variableARS,
    pct: {
      fixed: pctOf(fixedARS),
      variable: pctOf(variableARS),
      shortTerm: budget.savings.shortTermPct,
      longTerm: budget.savings.longTermPct,
    },
    overAllocated: variableARS < 0,
  }
}

export function emptyBudget(month: MonthKey): Budget {
  return {
    month,
    incomes: [],
    deductions: [],
    fixedExpenses: [],
    savings: { shortTermPct: 0, longTermPct: 0 },
  }
}

export function copyBudget(source: Budget, month: MonthKey): Budget {
  return {
    month,
    incomes: source.incomes.map((item) => ({ ...item })),
    deductions: source.deductions.map((item) => ({ ...item })),
    fixedExpenses: source.fixedExpenses.map((item) => ({ ...item })),
    savings: { ...source.savings },
  }
}
