import { describe, expect, it } from 'vitest'
import type { Expense } from '@shared/types'
import { necessaryBreakdown } from './necessaryBreakdown'

const baseExpense: Omit<Expense, 'id' | 'amountARS' | 'necessary'> = {
  date: new Date('2026-09-12T12:00:00Z'),
  month: '2026-09',
  amount: 1,
  currency: 'ARS',
  rate: { type: 'cripto', side: 'compra', value: 1, at: '2026-09-12T00:00:00Z' },
  amountUSD: 1,
  description: 'Gasto',
  category: 'other',
  paymentMethod: 'debit',
  source: 'app',
}

function expense(id: string, amountARS: number, necessary: boolean): Expense {
  return { ...baseExpense, id, amountARS, necessary }
}

describe('necessaryBreakdown', () => {
  it('separates necessary and unnecessary spending', () => {
    expect(necessaryBreakdown([expense('rent', 75_000, true), expense('movie', 25_000, false)])).toEqual({
      total: 100_000,
      necessary: 75_000,
      unnecessary: 25_000,
      necessaryPct: 75,
      unnecessaryPct: 25,
    })
  })

  it('keeps rounded percentages complementary', () => {
    const result = necessaryBreakdown([expense('groceries', 1, true), expense('coffee', 2, false)])

    expect(result).toMatchObject({ necessaryPct: 33, unnecessaryPct: 67 })
    expect(result.necessaryPct + result.unnecessaryPct).toBe(100)
  })

  it('represents a filtered one-kind result as a complete proportion', () => {
    expect(necessaryBreakdown([expense('groceries', 4_500, true)])).toMatchObject({
      necessary: 4_500,
      unnecessary: 0,
      necessaryPct: 100,
      unnecessaryPct: 0,
    })
  })

  it('has no proportion when there are no visible expenses', () => {
    expect(necessaryBreakdown([])).toEqual({
      total: 0,
      necessary: 0,
      unnecessary: 0,
      necessaryPct: 0,
      unnecessaryPct: 0,
    })
  })
})
