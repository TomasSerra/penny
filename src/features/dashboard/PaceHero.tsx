import { Alert02Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Pace } from '@shared/pace'
import type { Currency, MonthKey } from '@shared/types'
import { Penny, type PennyPose } from '@/components/brand/Penny'
import { Money } from '@/components/common/Money'
import { Button } from '@/components/ui/button'
import { formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATUS = {
  ok: { icon: CheckmarkCircle02Icon, text: 'text-success', fill: 'bg-penny', track: 'bg-paper-card' },
  warning: { icon: Alert02Icon, text: 'text-warning', fill: 'bg-warning', track: 'bg-paper-card' },
  over: { icon: Alert02Icon, text: 'text-destructive', fill: 'bg-destructive', track: 'bg-paper-card' },
} as const

function statusLabel(pace: Pace) {
  if (pace.status === 'over') return 'Te pasaste del presupuesto'
  if (pace.status === 'warning') return 'A este ritmo te pasás'
  if (pace.period === 'past') return 'Cerraste dentro del presupuesto'
  if (pace.period === 'future') return 'Todavía no empezó'
  return 'Vas bien'
}

/** Penny reacts to how the month is going — a closed month within budget earns the cheer. */
function statusPose(pace: Pace): PennyPose {
  if (pace.status === 'over') return 'angry'
  if (pace.status === 'warning') return 'surprise'
  if (pace.period === 'past') return 'celebration'
  return 'thumbUp'
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="sticker inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-muted-foreground">
      {children}
    </span>
  )
}

interface PaceHeroProps {
  pace: Pace
  currency: Currency
  convert: (ars: number) => number
}

export function PaceHero({ pace, currency, convert }: PaceHeroProps) {
  const status = STATUS[pace.status]
  const remaining = convert(pace.remaining)
  const ideal = pace.period === 'current' ? pace.daysElapsed / pace.daysInMonth : null
  const percentUsed = Math.round(pace.progress * 100)

  return (
    <section className="paper relative rounded-4xl p-6 md:p-8">
      <Penny
        pose={statusPose(pace)}
        className="pointer-events-none absolute -top-10 right-1 h-24 rotate-3 sm:-top-8 sm:right-4 sm:h-28 md:-top-6 md:right-8 md:h-36"
      />

      <p className="relative text-sm text-muted-foreground">{remaining >= 0 ? 'Disponible para gastar' : 'Te pasaste por'}</p>
      <Money
        value={Math.abs(remaining)}
        currency={currency}
        animated
        cents={currency === 'USD'}
        className={cn('relative mt-1.5 font-display text-5xl md:text-6xl', remaining < 0 && 'text-destructive')}
      />
      <p className="relative mt-2 max-w-sm text-sm text-muted-foreground sm:max-w-none">
        Gastaste <Money value={convert(pace.spent)} currency={currency} className="font-medium text-foreground" /> de{' '}
        <Money value={convert(pace.budget)} currency={currency} className="font-medium text-foreground" /> en gastos variables
      </p>

      <div
        className={cn('relative mt-6 h-3.5 overflow-hidden rounded-full border-2 border-ink', status.track)}
        role="meter"
        aria-label="Presupuesto de gastos variables usado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percentUsed, 100)}
      >
        <motion.div
          className={cn('h-full rounded-r-full', status.fill)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pace.progress, 1) * 100}%` }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
        {ideal !== null && (
          <span
            aria-hidden
            className="absolute top-1/2 h-full w-[3px] -translate-x-1/2 -translate-y-1/2 bg-ink"
            style={{ left: `${ideal * 100}%` }}
          />
        )}
      </div>
      <div className="relative mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{percentUsed}% usado</span>
        {ideal !== null && (
          <span>
            Hoy · día {pace.daysElapsed} de {pace.daysInMonth}
          </span>
        )}
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <Chip>
          <HugeiconsIcon icon={status.icon} className={cn('size-4', status.text)} strokeWidth={2} />
          <span className="font-medium text-foreground">{statusLabel(pace)}</span>
        </Chip>
        {pace.period === 'current' && pace.dailyAllowance !== null && (
          <Chip>
            <Money value={convert(pace.dailyAllowance)} currency={currency} className="font-semibold text-foreground" /> por día ·{' '}
            {pace.daysLeft} {pace.daysLeft === 1 ? 'día' : 'días'}
          </Chip>
        )}
        {pace.period === 'current' && pace.daysElapsed >= 3 && (
          <Chip>
            Proyección <Money value={convert(pace.projected)} currency={currency} className="font-semibold text-foreground" />
          </Chip>
        )}
      </div>
    </section>
  )
}

export function PaceHeroEmpty({ month }: { month: MonthKey }) {
  return (
    <section className="paper relative flex flex-col items-start justify-center rounded-4xl p-6 md:p-8">
      <Penny pose="rock" className="pointer-events-none absolute -top-10 right-1 h-24 -rotate-3 sm:-top-8 sm:right-4 sm:h-28 md:-top-6 md:right-8 md:h-32" />
      <h2 className="relative font-display text-3xl leading-tight">Falta tu presupuesto</h2>
      <p className="relative mt-2 max-w-md text-sm text-muted-foreground">
        Cargá ingresos, gastos fijos y ahorro de {formatMonth(month, { year: false }).toLowerCase()} para saber cuánto podés gastar por día.
      </p>
      <Button asChild className="relative mt-5">
        <Link to={`/presupuesto?mes=${month}`}>Armar presupuesto</Link>
      </Button>
    </section>
  )
}
