import { describe, expect, it } from 'vitest'
import { arDate, calendarParts } from './dates.js'
import { buildExpenses, buildSubscriptionExpense, dueSubscriptionMonths } from './expenses.js'
import type { ExpenseInput } from './normalize.js'
import type { RateSnapshot, Subscription } from './types.js'

const rate: RateSnapshot = { type: 'cripto', side: 'compra', value: 1590, at: '2026-09-15T00:00:00Z' }
const context = { rate, closingDay: 20, source: 'app' as const, groupId: 'g1' }

const input: ExpenseInput = {
  date: arDate(2026, 8, 24),
  amount: 464_998,
  currency: 'ARS',
  description: 'Cubiertas auto x2',
  category: 'car',
  paymentMethod: 'credit',
  necessary: true,
  installments: 1,
}

describe('buildExpenses', () => {
  it('keeps single payments in the purchase month', () => {
    const [expense] = buildExpenses(input, context)
    expect(expense.month).toBe('2026-08')
    expect(expense.amountARS).toBe(464_998)
    expect(expense.amountUSD).toBe(292.45)
    expect(expense.installment).toBeUndefined()
  })

  it('creates one document per installment in statement months', () => {
    const expenses = buildExpenses({ ...input, installments: 3 }, context)
    expect(expenses).toHaveLength(3)
    expect(expenses.map((e) => e.month)).toEqual(['2026-09', '2026-10', '2026-11'])
    expenses.forEach((expense) => {
      const { year, month } = calendarParts(expense.date)
      expect(`${year}-${String(month).padStart(2, '0')}`).toBe(expense.month)
      expect(expense.installment?.groupId).toBe('g1')
    })
    expect(expenses[2].installment).toMatchObject({ number: 3, total: 3, totalAmount: 464_998 })
  })

  it('keeps the purchase date for the first installment and dates later ones on the 1st', () => {
    const [first, second] = buildExpenses({ ...input, date: arDate(2026, 8, 10), installments: 2 }, context)
    expect(calendarParts(first.date)).toMatchObject({ month: 8, day: 10 })
    expect(calendarParts(second.date)).toMatchObject({ month: 9, day: 1 })

    // Purchase after the closing day: the first installment already lands in the next statement.
    const [shifted] = buildExpenses({ ...input, installments: 2 }, context)
    expect(calendarParts(shifted.date)).toMatchObject({ month: 9, day: 1 })
    expect(shifted.installment?.purchaseDate).toEqual(input.date)
  })

  it('converts USD expenses to ARS', () => {
    const [expense] = buildExpenses({ ...input, amount: 20, currency: 'USD', paymentMethod: 'debit' }, context)
    expect(expense.amountARS).toBe(31_800)
    expect(expense.amountUSD).toBe(20)
  })
})

describe('subscriptions', () => {
  const subscription: Subscription = {
    id: 'netflix',
    name: 'Netflix',
    amount: 10,
    currency: 'USD',
    category: 'entertainment',
    paymentMethod: 'credit',
    necessary: false,
    dayOfMonth: 20,
    startMonth: '2026-08',
    active: true,
  }

  it('lists due months from the start month up to today', () => {
    expect(dueSubscriptionMonths(subscription, arDate(2026, 9, 15))).toEqual(['2026-08'])
    expect(dueSubscriptionMonths(subscription, arDate(2026, 9, 21))).toEqual(['2026-08', '2026-09'])
    expect(dueSubscriptionMonths({ ...subscription, active: false }, arDate(2026, 9, 21))).toEqual([])
  })

  it('builds a deterministic expense per month', () => {
    const expense = buildSubscriptionExpense(subscription, '2026-09', rate)
    expect(expense.id).toBe('sub_netflix_202609')
    expect(expense.amountARS).toBe(15_900)
    expect(expense.source).toBe('subscription')
  })
})
