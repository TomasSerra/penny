import { findCategory, findPaymentMethod, CATEGORIES, PAYMENT_METHODS } from './catalog.js'
import { arDate, calendarParts } from './dates.js'
import type { CategoryId, Currency, PaymentMethodId } from './types.js'

export interface ExpenseInput {
  date: Date
  amount: number
  currency: Currency
  description: string
  category: CategoryId
  paymentMethod: PaymentMethodId
  necessary: boolean
  installments: number
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

export const MAX_INSTALLMENTS = 48

/** Accepts numbers and strings like "$13.600", "13,600", "1.234,56" or "US$ 20". */
export function parseAmount(input: unknown): { amount: number; currency?: Currency } | undefined {
  if (typeof input === 'number') return Number.isFinite(input) && input > 0 ? { amount: input } : undefined
  if (typeof input !== 'string') return undefined

  const currency: Currency | undefined = /u\$s|us\$|usd|dolar|dólar/i.test(input)
    ? 'USD'
    : /ars|\$/i.test(input)
      ? 'ARS'
      : undefined
  let text = input.replace(/[^\d.,-]/g, '')
  if (!/\d/.test(text)) return undefined

  const lastDot = text.lastIndexOf('.')
  const lastComma = text.lastIndexOf(',')
  if (lastDot >= 0 && lastComma >= 0) {
    const decimal = lastDot > lastComma ? '.' : ','
    const thousands = decimal === '.' ? ',' : '.'
    text = text.split(thousands).join('').replace(decimal, '.')
  } else if (lastDot >= 0 || lastComma >= 0) {
    const separator = lastDot >= 0 ? '.' : ','
    const pieces = text.split(separator)
    const looksLikeThousands = pieces.length > 2 || pieces[pieces.length - 1].length === 3
    text = looksLikeThousands ? pieces.join('') : pieces.join('.')
  }

  const amount = Number(text)
  return Number.isFinite(amount) && amount > 0 ? { amount, currency } : undefined
}

export function parseBoolean(input: unknown): boolean | undefined {
  if (typeof input === 'boolean') return input
  if (typeof input === 'number') return input !== 0
  if (typeof input !== 'string') return undefined
  const text = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
  if (['si', 's', 'yes', 'y', 'true', '1', 'necesario'].includes(text)) return true
  if (['no', 'n', 'false', '0', 'no necesario'].includes(text)) return false
  return undefined
}

export function parseCurrency(input: unknown): Currency | undefined {
  if (typeof input !== 'string') return undefined
  const text = input.trim().toLowerCase()
  if (['usd', 'us$', 'u$s', 'dolar', 'dólar', 'dolares', 'dólares'].includes(text)) return 'USD'
  if (['ars', '$', 'pesos', 'peso'].includes(text)) return 'ARS'
  return undefined
}

const MONTH_NAMES: Record<string, number> = {
  ene: 1, enero: 1, jan: 1, january: 1,
  feb: 2, febrero: 2, february: 2,
  mar: 3, marzo: 3, march: 3,
  abr: 4, abril: 4, apr: 4, april: 4,
  may: 5, mayo: 5,
  jun: 6, junio: 6, june: 6,
  jul: 7, julio: 7, july: 7,
  ago: 8, agosto: 8, aug: 8, august: 8,
  sep: 9, sept: 9, septiembre: 9, setiembre: 9, september: 9,
  oct: 10, octubre: 10, october: 10,
  nov: 11, noviembre: 11, november: 11,
  dic: 12, diciembre: 12, dec: 12, december: 12,
}

function to24h(hour: number, meridiem?: string): number {
  if (!meridiem) return hour
  const pm = meridiem.startsWith('p')
  if (pm && hour < 12) return hour + 12
  if (!pm && hour === 12) return 0
  return hour
}

function fromWallClock(now: Date, year: number, month: number, day: number, time?: { hour: number; minute: number }): Date | undefined {
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  if (time) return arDate(year, month, day, time.hour, time.minute)
  const today = calendarParts(now)
  // A bare date equal to today keeps the current time so same-day ordering stays natural.
  if (today.year === year && today.month === month && today.day === day) return now
  return arDate(year, month, day, 12, 0)
}

const TIME_PATTERN = /(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])?\.?\s?m?\.?/i

function extractTime(text: string): { hour: number; minute: number } | undefined {
  const match = text.match(TIME_PATTERN)
  if (!match) return undefined
  return { hour: to24h(Number(match[1]), match[3]?.toLowerCase()), minute: Number(match[2]) }
}

/**
 * Parses the date formats an iOS Shortcut can produce: ISO strings, dd/mm/yyyy,
 * long English/Spanish dates ("Sep 15, 2026 at 1:20 PM", "15 de septiembre de 2026, 13:20"),
 * unix timestamps, or nothing (defaults to now).
 */
export function parseDate(input: unknown, now: Date = new Date()): Date | undefined {
  if (input === undefined || input === null || input === '') return now
  if (typeof input === 'number') {
    const ms = input > 1e12 ? input : input * 1000
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) ? undefined : date
  }
  if (typeof input !== 'string') return undefined
  const text = input.trim()
  if (!text) return now

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/)
  if (iso) {
    const [, y, m, d, hh, mm, zone] = iso
    if (hh && zone) {
      const date = new Date(text.replace(' ', 'T'))
      return Number.isNaN(date.getTime()) ? undefined : date
    }
    const time = hh ? { hour: Number(hh), minute: Number(mm) } : undefined
    return fromWallClock(now, Number(y), Number(m), Number(d), time)
  }

  const numeric = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(.*)$/)
  if (numeric) {
    const [, d, m, y, rest] = numeric
    const year = y.length === 2 ? 2000 + Number(y) : Number(y)
    return fromWallClock(now, year, Number(m), Number(d), extractTime(rest))
  }

  const lower = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const monthToken = lower.match(/[a-z]+/g)?.find((token) => token in MONTH_NAMES)
  const yearMatch = lower.match(/\b(\d{4})\b/)
  if (monthToken && yearMatch) {
    const time = extractTime(lower)
    const withoutTime = lower.replace(TIME_PATTERN, ' ').replace(yearMatch[0], ' ')
    const dayMatch = withoutTime.match(/\b(\d{1,2})\b/)
    if (dayMatch) return fromWallClock(now, Number(yearMatch[1]), MONTH_NAMES[monthToken], Number(dayMatch[1]), time)
  }

  const fallback = new Date(text)
  return Number.isNaN(fallback.getTime()) ? undefined : fallback
}

const FIELD_ALIASES: Record<keyof Omit<ExpenseInput, 'installments'> | 'installments', string[]> = {
  date: ['date', 'fecha'],
  amount: ['amount', 'monto', 'importe'],
  currency: ['currency', 'moneda'],
  description: ['description', 'descripcion', 'descripción', 'detalle'],
  category: ['category', 'categoria', 'categoría'],
  paymentMethod: ['paymentMethod', 'payment_method', 'medioDePago', 'medio de pago', 'medio'],
  necessary: ['necessary', 'necesario'],
  installments: ['installments', 'cuotas'],
}

function pick(body: Record<string, unknown>, field: keyof typeof FIELD_ALIASES): unknown {
  const lowered = Object.fromEntries(Object.entries(body).map(([key, value]) => [key.toLowerCase(), value]))
  for (const alias of FIELD_ALIASES[field]) {
    const value = lowered[alias.toLowerCase()]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

export function parseExpenseInput(body: unknown, now: Date = new Date()): ParseResult<ExpenseInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'El body tiene que ser un objeto JSON' }
  }
  const data = body as Record<string, unknown>

  const parsedAmount = parseAmount(pick(data, 'amount'))
  if (!parsedAmount) return { ok: false, error: '"amount" tiene que ser un número mayor a 0' }

  const category = findCategory(pick(data, 'category'))
  if (!category) {
    return { ok: false, error: `"category" inválida. Opciones: ${CATEGORIES.map((c) => c.label).join(', ')}` }
  }

  const paymentMethod = findPaymentMethod(pick(data, 'paymentMethod'))
  if (!paymentMethod) {
    return { ok: false, error: `"paymentMethod" inválido. Opciones: ${PAYMENT_METHODS.map((p) => p.label).join(', ')}` }
  }

  const date = parseDate(pick(data, 'date'), now)
  if (!date) return { ok: false, error: '"date" no tiene un formato reconocible (usá dd/mm/aaaa o ISO)' }

  const rawNecessary = pick(data, 'necessary')
  const necessary = rawNecessary === undefined ? true : parseBoolean(rawNecessary)
  if (necessary === undefined) return { ok: false, error: '"necessary" tiene que ser Si o No' }

  const rawInstallments = pick(data, 'installments')
  const installments = rawInstallments === undefined ? 1 : Math.trunc(Number(rawInstallments))
  if (!Number.isFinite(installments) || installments < 1 || installments > MAX_INSTALLMENTS) {
    return { ok: false, error: `"installments" tiene que ser un número entre 1 y ${MAX_INSTALLMENTS}` }
  }

  const rawDescription = pick(data, 'description')
  const description = (typeof rawDescription === 'string' ? rawDescription : String(rawDescription ?? ''))
    .trim()
    .slice(0, 200)

  return {
    ok: true,
    value: {
      date,
      amount: parsedAmount.amount,
      currency: parseCurrency(pick(data, 'currency')) ?? parsedAmount.currency ?? 'ARS',
      description: description || CATEGORIES.find((c) => c.id === category)!.label,
      category,
      paymentMethod,
      necessary,
      installments: paymentMethod === 'credit' ? installments : 1,
    },
  }
}
