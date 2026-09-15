import { describe, expect, it } from 'vitest'
import { computeBudget, copyBudget } from './budget.js'
import type { Budget } from './types.js'

const sheetBudget: Budget = {
  month: '2026-09',
  incomes: [
    { id: 'ars', name: 'Sueldo ARS', amount: 1_248_000, currency: 'ARS' },
    { id: 'usd', name: 'Sueldo USD', amount: 390, currency: 'USD' },
  ],
  deductions: [{ id: 'mono', name: 'Monotributo', amount: 75_000, currency: 'ARS' }],
  fixedExpenses: [
    { id: '1', name: 'Peluquería', amount: 20_000, currency: 'ARS' },
    { id: '2', name: 'Dutasteride', amount: 16_000, currency: 'ARS' },
    { id: '3', name: 'Minoxidil', amount: 8_000, currency: 'ARS' },
    { id: '4', name: 'Almuerzos', amount: 104_000, currency: 'ARS' },
    { id: '5', name: 'Seguro Auto', amount: 177_000, currency: 'ARS' },
    { id: '6', name: 'Patente', amount: 39_500, currency: 'ARS' },
  ],
  savings: { shortTermPct: 30, longTermPct: 10 },
}

describe('computeBudget', () => {
  it('reproduces the spreadsheet numbers', () => {
    const summary = computeBudget(sheetBudget, 1589.59)
    expect(Math.round(summary.netARS)).toBe(1_792_940)
    expect(summary.fixedARS).toBe(364_500)
    expect(summary.pct.fixed).toBeCloseTo(20.33, 2)
    expect(Math.round(summary.variableARS)).toBe(711_264)
    expect(Math.round(summary.shortTermARS)).toBe(537_882)
    expect(Math.round(summary.longTermARS)).toBe(179_294)
    expect(Math.round(summary.netARS / summary.rate)).toBe(1128)
    expect(summary.overAllocated).toBe(false)
  })

  it('supports ARS-only incomes without deductions', () => {
    const summary = computeBudget(
      {
        incomes: [{ id: 'a', name: 'Sueldo', amount: 1_000_000, currency: 'ARS' }],
        deductions: [],
        fixedExpenses: [],
        savings: { shortTermPct: 20, longTermPct: 0 },
      },
      1500,
    )
    expect(summary.netARS).toBe(1_000_000)
    expect(summary.variableARS).toBe(800_000)
    expect(summary.pct.variable).toBe(80)
  })

  it('flags over-allocation and handles empty budgets', () => {
    const over = computeBudget({ ...sheetBudget, savings: { shortTermPct: 70, longTermPct: 20 } }, 1589.59)
    expect(over.overAllocated).toBe(true)

    const empty = computeBudget({ incomes: [], deductions: [], fixedExpenses: [], savings: { shortTermPct: 0, longTermPct: 0 } }, 1500)
    expect(empty.pct.fixed).toBe(0)
    expect(empty.variableARS).toBe(0)
  })

  it('copies a budget into another month without the rate snapshot', () => {
    const copy = copyBudget({ ...sheetBudget, rateSnapshot: { type: 'cripto', side: 'compra', value: 1, at: '' } }, '2026-10')
    expect(copy.month).toBe('2026-10')
    expect(copy.rateSnapshot).toBeUndefined()
    expect(copy.incomes).not.toBe(sheetBudget.incomes)
    expect(copy.incomes).toEqual(sheetBudget.incomes)
  })
})
