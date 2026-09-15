import type { RateConfig, RateSide, RateSnapshot, RateType } from './types.js'

export const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares'

export interface DolarQuote {
  moneda: string
  casa: RateType
  nombre: string
  compra: number | null
  venta: number | null
  fechaActualizacion: string
}

export const RATE_TYPES: { id: RateType; label: string }[] = [
  { id: 'oficial', label: 'Oficial' },
  { id: 'blue', label: 'Blue' },
  { id: 'bolsa', label: 'MEP' },
  { id: 'contadoconliqui', label: 'CCL' },
  { id: 'cripto', label: 'Cripto' },
  { id: 'mayorista', label: 'Mayorista' },
  { id: 'tarjeta', label: 'Tarjeta' },
]

export const RATE_SIDES: { id: RateSide; label: string }[] = [
  { id: 'compra', label: 'Compra' },
  { id: 'venta', label: 'Venta' },
]

export function rateLabel(config: RateConfig): string {
  const type = RATE_TYPES.find((item) => item.id === config.type)?.label ?? config.type
  return `${type} · ${config.side === 'compra' ? 'Compra' : 'Venta'}`
}

export function quoteToSnapshot(quote: DolarQuote, side: RateSide): RateSnapshot {
  const value = quote[side] ?? quote.venta ?? quote.compra
  if (!value) throw new Error(`La cotización ${quote.casa} no tiene valor`)
  return { type: quote.casa, side, value, at: quote.fechaActualizacion }
}

export async function fetchQuotes(fetchImpl: typeof fetch = fetch): Promise<DolarQuote[]> {
  const response = await fetchImpl(DOLAR_API_URL)
  if (!response.ok) throw new Error(`dolarapi respondió ${response.status}`)
  return (await response.json()) as DolarQuote[]
}

export async function fetchRate(config: RateConfig, fetchImpl: typeof fetch = fetch): Promise<RateSnapshot> {
  const response = await fetchImpl(`${DOLAR_API_URL}/${config.type}`)
  if (!response.ok) throw new Error(`dolarapi respondió ${response.status}`)
  return quoteToSnapshot((await response.json()) as DolarQuote, config.side)
}
