import type { MonthKey } from './types.js'

/** Argentina has a fixed UTC-3 offset (no DST), so all calendar math is done in that zone. */
export const APP_TIME_ZONE = 'America/Argentina/Buenos_Aires'
const AR_OFFSET_HOURS = 3

export interface CalendarParts {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

export function calendarParts(date: Date): CalendarParts {
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]))
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  }
}

/** Builds a Date from Argentina wall-clock time. */
export function arDate(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour + AR_OFFSET_HOURS, minute))
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function toMonthKey(year: number, month: number): MonthKey {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function monthKeyOf(date: Date): MonthKey {
  const { year, month } = calendarParts(date)
  return toMonthKey(year, month)
}

export function parseMonthKey(key: MonthKey): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number)
  return { year, month }
}

export function addMonths(key: MonthKey, amount: number): MonthKey {
  const { year, month } = parseMonthKey(key)
  const index = year * 12 + (month - 1) + amount
  return toMonthKey(Math.floor(index / 12), (index % 12) + 1)
}

export function compareMonths(a: MonthKey, b: MonthKey): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function monthsBetween(from: MonthKey, to: MonthKey): MonthKey[] {
  const result: MonthKey[] = []
  for (let key = from; compareMonths(key, to) <= 0; key = addMonths(key, 1)) result.push(key)
  return result
}

/** Moves a date into another month keeping its day (clamped) and time. */
export function withMonth(date: Date, key: MonthKey): Date {
  const { day, hour, minute } = calendarParts(date)
  const { year, month } = parseMonthKey(key)
  return arDate(year, month, Math.min(day, daysInMonth(year, month)), hour, minute)
}
