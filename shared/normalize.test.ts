import { describe, expect, it } from 'vitest'
import { findCategory, findPaymentMethod } from './catalog.js'
import { arDate, calendarParts } from './dates.js'
import { parseAmount, parseBoolean, parseDate, parseExpenseInput } from './normalize.js'

const now = arDate(2026, 9, 15, 13, 20)

describe('parseAmount', () => {
  it.each([
    [13600, 13600],
    ['13600', 13600],
    ['$13.600', 13600],
    ['13,600', 13600],
    ['1.234.567', 1234567],
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['99,5', 99.5],
    ['20.5', 20.5],
  ])('parses %s', (input, expected) => {
    expect(parseAmount(input)?.amount).toBe(expected)
  })

  it('detects USD hints and rejects invalid amounts', () => {
    expect(parseAmount('US$ 20')).toEqual({ amount: 20, currency: 'USD' })
    expect(parseAmount('abc')).toBeUndefined()
    expect(parseAmount(0)).toBeUndefined()
    expect(parseAmount('-5')).toBeUndefined()
  })
})

describe('parseBoolean', () => {
  it.each([
    ['Si', true],
    ['Sí', true],
    ['true', true],
    ['No', false],
    [false, false],
    [1, true],
  ])('parses %s', (input, expected) => {
    expect(parseBoolean(input)).toBe(expected)
  })
})

describe('parseDate', () => {
  const partsOf = (value: unknown) => {
    const date = parseDate(value, now)
    return date && calendarParts(date)
  }

  it('defaults to now when empty', () => {
    expect(parseDate(undefined, now)).toBe(now)
    expect(parseDate('', now)).toBe(now)
  })

  it('parses dd/mm/yyyy with and without time', () => {
    expect(partsOf('14/09/2026')).toMatchObject({ year: 2026, month: 9, day: 14, hour: 12 })
    expect(partsOf('14/9/26 08:05')).toMatchObject({ year: 2026, month: 9, day: 14, hour: 8, minute: 5 })
    expect(parseDate('15/09/2026', now)).toBe(now)
  })

  it('parses ISO strings', () => {
    expect(partsOf('2026-09-14T10:00:00-03:00')).toMatchObject({ day: 14, hour: 10 })
    expect(partsOf('2026-09-14')).toMatchObject({ day: 14, hour: 12 })
  })

  it('parses long English and Spanish dates from Shortcuts', () => {
    expect(partsOf('Sep 14, 2026 at 1:20 PM')).toMatchObject({ month: 9, day: 14, hour: 13, minute: 20 })
    expect(partsOf('14 de septiembre de 2026, 21:45')).toMatchObject({ month: 9, day: 14, hour: 21, minute: 45 })
    expect(partsOf('14 sept 2026')).toMatchObject({ month: 9, day: 14 })
  })

  it('rejects garbage', () => {
    expect(parseDate('mañana', now)).toBeUndefined()
  })
})

describe('catalog matching', () => {
  it('matches categories with or without emoji', () => {
    expect(findCategory('🍔 Comida')).toBe('food')
    expect(findCategory('comida')).toBe('food')
    expect(findCategory('💅 Cuidado personal')).toBe('personal_care')
    expect(findCategory('CUIDADO PERSONAL')).toBe('personal_care')
    expect(findCategory('✈️ Viajes')).toBe('travel')
    expect(findCategory('nope')).toBeUndefined()
  })

  it('matches payment methods and aliases', () => {
    expect(findPaymentMethod('📱 Billetera virtual')).toBe('wallet')
    expect(findPaymentMethod('Tarjeta de crédito')).toBe('credit')
    expect(findPaymentMethod('debito')).toBe('debit')
    expect(findPaymentMethod('💵 Efectivo')).toBe('cash')
  })
})

describe('parseExpenseInput', () => {
  it('accepts the current Shortcut payload', () => {
    const result = parseExpenseInput(
      {
        date: '14/09/2026',
        amount: '13600',
        description: 'Milanesa Sirius',
        category: '🍔 Comida',
        paymentMethod: '📱 Billetera virtual',
        necessary: 'Si',
      },
      now,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({
      amount: 13600,
      currency: 'ARS',
      description: 'Milanesa Sirius',
      category: 'food',
      paymentMethod: 'wallet',
      necessary: true,
      installments: 1,
      cardMonthOffset: 1,
    })
  })

  it('reads which month a credit purchase is paid in', () => {
    const later = parseExpenseInput({ amount: 100, category: 'Auto', paymentMethod: 'Crédito', impacta: '2' }, now)
    expect(later.ok && later.value.cardMonthOffset).toBe(2)
    const invalid = parseExpenseInput({ amount: 100, category: 'Auto', paymentMethod: 'Crédito', cardMonthOffset: 3 }, now)
    expect(invalid.ok).toBe(false)
  })

  it('ignores installments for non-credit payments', () => {
    const result = parseExpenseInput({ amount: 100, category: 'Auto', paymentMethod: 'Efectivo', installments: 6 }, now)
    expect(result.ok && result.value.installments).toBe(1)
  })

  it('returns helpful errors', () => {
    expect(parseExpenseInput(null, now)).toMatchObject({ ok: false })
    expect(parseExpenseInput({ amount: 'x', category: 'Comida', paymentMethod: 'Efectivo' }, now)).toMatchObject({ ok: false })
    const badCategory = parseExpenseInput({ amount: 1, category: 'Nada', paymentMethod: 'Efectivo' }, now)
    expect(badCategory.ok === false && badCategory.error).toContain('Comida')
  })
})
