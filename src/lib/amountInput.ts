/**
 * Amount inputs always use the es-AR convention ("1.234,56"). Grouping dots are
 * inserted while typing and a typed "." becomes the decimal comma, so the
 * iOS decimal keypad works in any region.
 */
export function formatAmountInput(raw: string, previous: string): string {
  let text = raw
  if (raw.length === previous.length + 1 && raw.endsWith('.')) text = `${raw.slice(0, -1)},`
  text = text.replace(/\./g, '').replace(/[^\d,]/g, '')
  const [integerRaw, ...decimals] = text.split(',')
  const integer = integerRaw.replace(/^0+(?=\d)/, '')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  if (decimals.length === 0) return grouped
  return `${grouped || '0'},${decimals.join('').slice(0, 2)}`
}

export function parseAmountInput(text: string): number {
  if (!text) return 0
  const value = Number(text.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(value) ? value : 0
}

export function amountToInput(value: number): string {
  if (!value) return ''
  return formatAmountInput(String(Math.round(value * 100) / 100).replace('.', ','), '')
}
