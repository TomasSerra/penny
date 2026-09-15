import type { Currency } from './types.js'

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function toARS(amount: number, currency: Currency, rate: number): number {
  return currency === 'USD' ? amount * rate : amount
}

export function toUSD(amount: number, currency: Currency, rate: number): number {
  if (currency === 'USD') return amount
  return rate > 0 ? amount / rate : 0
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}
