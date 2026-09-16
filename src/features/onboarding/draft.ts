import type { MoneyItem, RateConfig, Savings } from '@shared/types'

/** What the flow collects, in the order the steps ask for it. */
export interface OnboardingDraft {
  incomes: MoneyItem[]
  savings: Savings
  rate: RateConfig
}

export const newIncome = (name = ''): MoneyItem => ({ id: crypto.randomUUID(), name, amount: 0, currency: 'ARS' })
