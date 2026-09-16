import type { Currency } from '@shared/types'
import { currencySymbol, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from './AnimatedNumber'

interface MoneyProps {
  value: number
  currency?: Currency
  cents?: boolean
  animated?: boolean
  /** With `animated`, count up from zero on mount (default) or start at the value */
  fromZero?: boolean
  /** Equal-width digits, only for amounts that align in a column */
  tabular?: boolean
  className?: string
  symbolClassName?: string
}

function numberPart(value: number, currency: Currency, cents?: boolean) {
  return formatMoney(Math.abs(value), currency, { cents }).replace(currencySymbol(currency), '').replace(/ /g, ' ').trim()
}

/** Amount with a de-emphasized currency symbol. */
export function Money({ value, currency = 'ARS', cents, animated, fromZero, tabular, className, symbolClassName }: MoneyProps) {
  const negative = value < 0
  return (
    <span className={cn('inline-flex items-baseline whitespace-nowrap', tabular && 'tabular-nums', className)}>
      {negative && <span>−</span>}
      <span className={cn('mr-[0.2em] text-[0.62em] font-medium opacity-55', symbolClassName)}>{currencySymbol(currency)}</span>
      {animated ? (
        // Keyed by currency: tweening straight from an ARS amount to a USD one would print the big
        // ARS figures in the USD format (with cents), wider than either end, and push the card out.
        // Restarting in the new currency only ever counts up to the final width.
        <AnimatedNumber
          key={currency}
          value={Math.abs(value)}
          fromZero={fromZero}
          format={(latest) => numberPart(latest, currency, cents)}
        />
      ) : (
        <span>{numberPart(value, currency, cents)}</span>
      )}
    </span>
  )
}
