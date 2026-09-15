import { describe, expect, it } from 'vitest'
import { arDate } from './dates.js'
import { computePace } from './pace.js'

describe('computePace', () => {
  it('computes the daily allowance for the current month', () => {
    const pace = computePace({ budget: 300_000, spent: 90_000, month: '2026-09', today: arDate(2026, 9, 15) })
    expect(pace.period).toBe('current')
    expect(pace.daysLeft).toBe(16)
    expect(pace.remaining).toBe(210_000)
    expect(pace.dailyAllowance).toBe(13_125)
    expect(pace.projected).toBe(180_000)
    expect(pace.status).toBe('ok')
  })

  it('warns when the projection exceeds the budget', () => {
    const pace = computePace({ budget: 300_000, spent: 200_000, month: '2026-09', today: arDate(2026, 9, 15) })
    expect(pace.status).toBe('warning')
  })

  it('does not warn during the first days of the month', () => {
    const pace = computePace({ budget: 300_000, spent: 100_000, month: '2026-09', today: arDate(2026, 9, 2) })
    expect(pace.status).toBe('ok')
  })

  it('reports over budget and a closed past month', () => {
    const pace = computePace({ budget: 100_000, spent: 120_000, month: '2026-08', today: arDate(2026, 9, 15) })
    expect(pace.period).toBe('past')
    expect(pace.status).toBe('over')
    expect(pace.dailyAllowance).toBeNull()
  })
})
