import { Calendar03Icon, MinusSignIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { es } from 'react-day-picker/locale'
import { CATEGORIES, PAYMENT_METHODS } from '@shared/catalog'
import { arDate, calendarParts } from '@shared/dates'
import type { CategoryId, Currency, PaymentMethodId } from '@shared/types'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { amountToInput, formatAmountInput, parseAmountInput } from '@/lib/amountInput'
import { currencySymbol, formatDayLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

const SELECT_SPRING = { type: 'spring', bounce: 0.2, duration: 0.4 } as const

export function FieldLabel({ children, className, htmlFor }: { children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-2 block text-xs font-medium tracking-wide text-muted-foreground uppercase', className)}>
      {children}
    </label>
  )
}

export function FieldError({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs text-destructive">{children}</p>
}

/** Compact money input used in lists (budget rows, subscriptions). */
export function MoneyInput({
  value,
  onChange,
  currency,
  className,
  id,
  ariaLabel,
}: {
  value: number
  onChange: (value: number) => void
  currency: Currency
  className?: string
  id?: string
  ariaLabel?: string
}) {
  const [text, setText] = useState(() => amountToInput(value))

  // Follow external changes (e.g. a copied budget) without fighting the user's typing.
  useEffect(() => {
    if (parseAmountInput(text) !== value) setText(amountToInput(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted-foreground">
        {currencySymbol(currency)}
      </span>
      <Input
        id={id}
        aria-label={ariaLabel}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        value={text}
        onChange={(event) => {
          const next = formatAmountInput(event.target.value, text)
          setText(next)
          onChange(parseAmountInput(next))
        }}
        className={cn('text-right tabular-nums', currency === 'USD' ? 'pl-12' : 'pl-8')}
      />
    </div>
  )
}

export function CurrencyToggle({ value, onChange, size = 'sm' }: { value: Currency; onChange: (value: Currency) => void; size?: 'sm' | 'md' }) {
  return (
    <SegmentedControl<Currency>
      size={size}
      value={value}
      onChange={onChange}
      options={[
        { value: 'ARS', label: 'ARS' },
        { value: 'USD', label: 'USD' },
      ]}
    />
  )
}

export function CategoryPicker({ value, onChange }: { value: CategoryId | null; onChange: (value: CategoryId) => void }) {
  const layoutId = useId()
  return (
    <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="Categoría">
      {CATEGORIES.map((category) => {
        const selected = value === category.id
        return (
          <motion.button
            key={category.id}
            type="button"
            role="radio"
            aria-checked={selected}
            whileTap={{ scale: 0.93 }}
            onClick={() => onChange(category.id)}
            className={cn(
              'relative flex h-[4.6rem] flex-col items-center justify-center gap-1.5 rounded-2xl px-0.5 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              selected ? 'text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.04]',
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={SELECT_SPRING}
                className="absolute inset-0 rounded-2xl bg-penny/15 ring-[1.5px] ring-penny/80 ring-inset"
              />
            )}
            <span className={cn('relative text-[1.55rem] leading-none transition-transform duration-300', selected && 'scale-110')}>
              {category.emoji}
            </span>
            <span className="relative line-clamp-2 max-w-full text-[10px] leading-[1.15] font-medium tracking-tight break-words hyphens-auto" lang="es">
              {category.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

export function PaymentPicker({ value, onChange }: { value: PaymentMethodId; onChange: (value: PaymentMethodId) => void }) {
  const layoutId = useId()
  return (
    <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Medio de pago">
      {PAYMENT_METHODS.map((method) => {
        const selected = value === method.id
        return (
          <motion.button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={selected}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(method.id)}
            className={cn(
              'relative flex h-12 items-center gap-2.5 rounded-2xl bg-foreground/[0.03] px-3 text-left text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-white/[0.03]',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={SELECT_SPRING}
                className="absolute inset-0 rounded-2xl bg-penny/15 ring-[1.5px] ring-penny/80 ring-inset"
              />
            )}
            <span className="relative text-lg leading-none">{method.emoji}</span>
            <span className="relative truncate">{method.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

export function NecessaryPicker({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <SegmentedControl<'yes' | 'no'>
      stretch
      value={value ? 'yes' : 'no'}
      onChange={(next) => onChange(next === 'yes')}
      options={[
        { value: 'yes', label: 'Necesario' },
        { value: 'no', label: 'No necesario' },
      ]}
    />
  )
}

export function DateField({ value, onChange }: { value: Date; onChange: (value: Date) => void }) {
  const [open, setOpen] = useState(false)
  const { year, month, day } = calendarParts(value)
  const selected = new Date(year, month - 1, day)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-11 w-full justify-start gap-2.5 rounded-full px-4 font-normal">
          <HugeiconsIcon icon={Calendar03Icon} className="text-muted-foreground" />
          {formatDayLabel(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-3xl p-2">
        <Calendar
          mode="single"
          locale={es}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return
            const now = calendarParts(new Date())
            onChange(arDate(date.getFullYear(), date.getMonth() + 1, date.getDate(), now.hour, now.minute))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  label: string
}) {
  return (
    <div className="glass inline-flex h-11 items-center rounded-full p-1" role="group" aria-label={label}>
      <Button type="button" variant="ghost" size="icon-sm" className="rounded-full" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} aria-label="Menos">
        <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
      </Button>
      <span className="w-9 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button type="button" variant="ghost" size="icon-sm" className="rounded-full" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} aria-label="Más">
        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
      </Button>
    </div>
  )
}
