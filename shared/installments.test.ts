import { describe, expect, it } from 'vitest'
import { addMonths, arDate, monthKeyOf, withMonth } from './dates.js'
import { splitInstallments, statementMonth } from './installments.js'

describe('dates', () => {
  it('uses Argentina time regardless of the host time zone', () => {
    // 01:30 UTC on Sep 1 is still Aug 31 in Buenos Aires
    expect(monthKeyOf(new Date('2026-09-01T01:30:00Z'))).toBe('2026-08')
  })

  it('adds months across years', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
  })

  it('clamps the day when moving to a shorter month', () => {
    expect(monthKeyOf(withMonth(arDate(2026, 1, 31), '2026-02'))).toBe('2026-02')
  })
})

describe('statementMonth', () => {
  it('keeps purchases up to the closing day in the same month', () => {
    expect(statementMonth(arDate(2026, 8, 10), 20)).toBe('2026-08')
    expect(statementMonth(arDate(2026, 8, 20, 23, 59), 20)).toBe('2026-08')
  })

  it('rolls purchases after the closing day to the next statement', () => {
    expect(statementMonth(arDate(2026, 8, 24), 20)).toBe('2026-09')
    expect(statementMonth(arDate(2026, 12, 28), 20)).toBe('2027-01')
  })

  it('clamps a closing day beyond the month length', () => {
    expect(statementMonth(arDate(2026, 2, 28), 31)).toBe('2026-02')
  })
})

describe('splitInstallments', () => {
  it('splits evenly and absorbs rounding in the last installment', () => {
    const slices = splitInstallments(464_998, 6, arDate(2026, 8, 24), 20)
    expect(slices.map((s) => s.month)).toEqual(['2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02'])
    expect(slices[0].amount).toBe(77_499.66)
    expect(slices[5].amount).toBe(77_499.7)
    expect(slices.reduce((total, s) => total + s.amount, 0)).toBeCloseTo(464_998, 2)
  })
})
