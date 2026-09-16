import { describe, expect, it } from 'vitest'
import { arDate, calendarParts } from './dates.js'
import {
  buildExpenses,
  buildSubscriptionExpense,
  chargesInMonth,
  dueSubscriptionMonths,
  nextChargeMonth,
  subscriptionChargesForMonth,
} from './expenses.js'
import type { ExpenseInput } from './normalize.js'
import type { Expense, RateSnapshot, Subscription } from './types.js'

const rate: RateSnapshot = { type: 'cripto', side: 'compra', value: 1590, at: '2026-09-15T00:00:00Z' }
const context = { rate, source: 'app' as const, groupId: 'g1' }

const input: ExpenseInput = {
  date: arDate(2026, 9, 12),
  amount: 464_998,
  currency: 'ARS',
  description: 'Cubiertas auto x2',
  category: 'car',
  paymentMethod: 'credit',
  necessary: true,
  installments: 1,
  cardMonthOffset: 1,
}

describe('buildExpenses', () => {
  it('keeps non-credit payments in the purchase month and date', () => {
    const [expense] = buildExpenses({ ...input, paymentMethod: 'debit', installments: 3 }, context)
    expect(expense.month).toBe('2026-09')
    expect(expense.date).toEqual(input.date)
    expect(expense.purchaseDate).toBeUndefined()
    expect(expense.installment).toBeUndefined()
  })

  it('puts a single credit payment in the month it is paid', () => {
    const [expense] = buildExpenses(input, context)
    expect(expense.month).toBe('2026-10')
    expect(calendarParts(expense.date)).toMatchObject({ month: 10, day: 1 })
    expect(expense.purchaseDate).toEqual(input.date)
    expect(expense.amountARS).toBe(464_998)
    expect(expense.amountUSD).toBe(292.45)
    expect(expense.installment).toBeUndefined()

    const [later] = buildExpenses({ ...input, cardMonthOffset: 2 }, context)
    expect(later.month).toBe('2026-11')
  })

  it('creates one document per installment starting in the paid month', () => {
    const expenses = buildExpenses({ ...input, installments: 3, cardMonthOffset: 2 }, context)
    expect(expenses.map((e) => e.month)).toEqual(['2026-11', '2026-12', '2027-01'])
    expenses.forEach((expense) => {
      const { year, month, day } = calendarParts(expense.date)
      expect(`${year}-${String(month).padStart(2, '0')}`).toBe(expense.month)
      expect(day).toBe(1)
      expect(expense.installment?.groupId).toBe('g1')
      expect(expense.installment?.purchaseDate).toEqual(input.date)
    })
    expect(expenses[2].installment).toMatchObject({ number: 3, total: 3, totalAmount: 464_998 })
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

  it('only charges every `frequencyMonths` from the start month', () => {
    const bimonthly = { ...subscription, frequencyMonths: 2 as const }
    expect(dueSubscriptionMonths(bimonthly, arDate(2026, 10, 21))).toEqual(['2026-08', '2026-10'])
    expect(chargesInMonth({ ...subscription, frequencyMonths: 12 }, '2027-08')).toBe(true)
    expect(chargesInMonth({ ...subscription, frequencyMonths: 12 }, '2027-02')).toBe(false)
    expect(chargesInMonth(subscription, '2026-07')).toBe(false)
  })

  it('finds the next charge month', () => {
    expect(nextChargeMonth({ ...subscription, frequencyMonths: 3 }, '2026-09')).toBe('2026-11')
    expect(nextChargeMonth({ ...subscription, frequencyMonths: 3 }, '2026-11')).toBe('2026-11')
    expect(nextChargeMonth(subscription, '2026-01')).toBe('2026-08')
  })

  it('builds a deterministic expense per month', () => {
    const expense = buildSubscriptionExpense(subscription, '2026-09', rate)
    expect(expense.id).toBe('sub_netflix_202609')
    expect(expense.amountARS).toBe(15_900)
    expect(expense.source).toBe('subscription')
  })

  it('counts recorded charges and projects the ones still to come', () => {
    const recorded = { ...buildSubscriptionExpense(subscription, '2026-09', { ...rate, value: 1500 }), id: 'x' } as Expense
    const gym: Subscription = { ...subscription, id: 'gym', name: 'Gimnasio', amount: 30_000, currency: 'ARS', startMonth: '2026-09' }
    const yearly: Subscription = { ...subscription, id: 'domain', startMonth: '2026-03', frequencyMonths: 12 }
    const today = arDate(2026, 9, 15)

    const september = subscriptionChargesForMonth([subscription, gym, yearly], [recorded], '2026-09', rate.value, today)
    expect(september.map((c) => [c.subscriptionId, c.amountARS, c.projected])).toEqual([
      ['netflix', 15_000, false],
      ['gym', 30_000, true],
    ])

    // Past months only count what was actually recorded.
    expect(subscriptionChargesForMonth([subscription, gym], [], '2026-08', rate.value, today)).toEqual([])
    expect(subscriptionChargesForMonth([{ ...gym, skippedMonths: ['2026-10'] }], [], '2026-10', rate.value, today)).toEqual([])
  })
})
