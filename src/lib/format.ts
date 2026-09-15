import { APP_TIME_ZONE, calendarParts, parseMonthKey } from '@shared/dates'
import type { Currency, MonthKey } from '@shared/types'

const LOCALE = 'es-AR'

const moneyFormatters = new Map<string, Intl.NumberFormat>()

function moneyFormatter(currency: Currency, fractionDigits: number) {
  const key = `${currency}-${fractionDigits}`
  let formatter = moneyFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
    moneyFormatters.set(key, formatter)
  }
  return formatter
}

/** ARS without cents ("$ 1.248.000"), USD with cents only for small amounts ("US$ 8,55"). */
export function formatMoney(value: number, currency: Currency = 'ARS', options: { cents?: boolean } = {}): string {
  const cents = options.cents ?? (currency === 'USD' ? Math.abs(value) < 100 && !Number.isInteger(value) : false)
  return moneyFormatter(currency, cents ? 2 : 0).format(value)
}

export function currencySymbol(currency: Currency): string {
  return currency === 'USD' ? 'US$' : '$'
}

/** Splits a formatted amount so the symbol can be styled apart from the number. */
export function moneyParts(value: number, currency: Currency = 'ARS', options: { cents?: boolean } = {}) {
  const formatted = formatMoney(value, currency, options)
  const symbol = currencySymbol(currency)
  const number = formatted.replace(symbol, '').replace(/ /g, ' ').trim()
  return { symbol, number, negative: value < 0 }
}

const compactFormatter = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 })

export function formatCompact(value: number, currency: Currency = 'ARS'): string {
  return `${currencySymbol(currency)} ${compactFormatter.format(value)}`
}

/** Short axis ticks without spaces ("$260k") so chart labels never wrap. */
export function formatAxis(value: number, currency: Currency = 'ARS'): string {
  if (value === 0) return '0'
  return `${currencySymbol(currency)}${compactFormatter.format(value).replace(/\s/g, '')}`
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: fractionDigits }).format(value)
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: fractionDigits }).format(value)}%`
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatMonth(key: MonthKey, options: { year?: boolean } = {}): string {
  const { year, month } = parseMonthKey(key)
  const name = new Intl.DateTimeFormat(LOCALE, { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 15)))
  return capitalize(options.year === false ? name : `${name} ${year}`)
}

export function formatShortMonth(key: MonthKey): string {
  const { year, month } = parseMonthKey(key)
  return new Intl.DateTimeFormat(LOCALE, { month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 15)))
    .replace('.', '')
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: APP_TIME_ZONE, ...options }).format(date).replace('.', '')
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: APP_TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(date)
}

/** `yyyy-MM-dd` in Argentina time, handy for grouping. */
export function dayKey(date: Date): string {
  const { year, month, day } = calendarParts(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function formatDayLabel(date: Date, now: Date = new Date()): string {
  const key = dayKey(date)
  if (key === dayKey(now)) return 'Hoy'
  if (key === dayKey(new Date(now.getTime() - 86_400_000))) return 'Ayer'
  return capitalize(formatDate(date, { weekday: 'long', day: 'numeric', month: 'short' }))
}
