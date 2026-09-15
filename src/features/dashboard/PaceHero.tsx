import { Alert02Icon, CheckmarkCircle02Icon, PieChartIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Pace } from '@shared/pace'
import type { Currency, MonthKey } from '@shared/types'
import { Money } from '@/components/common/Money'
import { Button } from '@/components/ui/button'
import { formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATUS = {
  ok: { icon: CheckmarkCircle02Icon, text: 'text-success', fill: 'bg-penny-gradient', track: 'bg-penny/15' },
  warning: { icon: Alert02Icon, text: 'text-warning', fill: 'bg-warning', track: 'bg-warning/15' },
  over: { icon: Alert02Icon, text: 'text-destructive', fill: 'bg-destructive', track: 'bg-destructive/15' },
} as const

function statusLabel(pace: Pace) {
  if (pace.status === 'over') return 'Te pasaste del presupuesto'
  if (pace.status === 'warning') return 'A este ritmo te pasás'
  if (pace.period === 'past') return 'Cerraste dentro del presupuesto'
  if (pace.period === 'future') return 'Todavía no empezó'
  return 'Vas bien'
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground/[0.045] px-3 text-xs text-muted-foreground ring-1 ring-foreground/[0.04] ring-inset dark:bg-white/[0.05]">
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
    <section className="glass relative overflow-hidden rounded-4xl p-6 md:p-8">
      <div aria-hidden className="pointer-events-none absolute -top-28 -right-20 size-80 rounded-full bg-penny/25 blur-3xl dark:bg-penny/8" />

      <p className="relative text-sm text-muted-foreground">{remaining >= 0 ? 'Disponible para gastar' : 'Te pasaste por'}</p>
      <Money
        value={Math.abs(remaining)}
        currency={currency}
        animated
        cents={currency === 'USD'}
        className={cn('relative mt-1.5 text-5xl font-semibold tracking-tight md:text-6xl', remaining < 0 && 'text-destructive')}
      />
      <p className="relative mt-2 text-sm text-muted-foreground">
        Gastaste <Money value={convert(pace.spent)} currency={currency} className="font-medium text-foreground" /> de{' '}
        <Money value={convert(pace.budget)} currency={currency} className="font-medium text-foreground" /> en gastos variables
      </p>

      <div
        className={cn('relative mt-6 h-2.5 rounded-full', status.track)}
        role="meter"
        aria-label="Presupuesto de gastos variables usado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percentUsed, 100)}
      >
        <motion.div
          className={cn('h-full rounded-full', status.fill)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pace.progress, 1) * 100}%` }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
        {ideal !== null && (
          <span
            aria-hidden
            className="absolute top-1/2 h-[1.125rem] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70 ring-2 ring-background/80"
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
    <section className="glass relative flex flex-col items-start justify-center overflow-hidden rounded-4xl p-6 md:p-8">
      <div aria-hidden className="pointer-events-none absolute -top-28 -right-20 size-80 rounded-full bg-penny/25 blur-3xl dark:bg-penny/8" />
      <span className="relative grid size-12 place-items-center rounded-2xl bg-penny/15 text-penny-ink">
        <HugeiconsIcon icon={PieChartIcon} className="size-6" strokeWidth={1.8} />
      </span>
      <h2 className="relative mt-4 font-display text-3xl leading-tight">Falta tu presupuesto</h2>
      <p className="relative mt-2 max-w-md text-sm text-muted-foreground">
        Cargá ingresos, gastos fijos y ahorro de {formatMonth(month, { year: false }).toLowerCase()} para saber cuánto podés gastar por día.
      </p>
      <Button asChild className="relative mt-5">
        <Link to={`/presupuesto?mes=${month}`}>Armar presupuesto</Link>
      </Button>
    </section>
  )
}
