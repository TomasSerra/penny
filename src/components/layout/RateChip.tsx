import { Link } from 'react-router'
import { rateLabel } from '@shared/rates'
import { useSession } from '@/app/session'
import { formatMoney, formatTime } from '@/lib/format'

export function RateChip() {
  const { settings, rate } = useSession()
  return (
    <Link
      to="/ajustes#dolar"
      className="group flex items-center justify-between rounded-2xl bg-foreground/[0.035] px-3.5 py-3 ring-1 ring-foreground/[0.05] transition-colors ring-inset hover:bg-foreground/[0.06] dark:bg-white/[0.04]"
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Dólar {rateLabel(settings.rate)}
        </span>
        <span className="block text-[0.95rem] font-semibold tabular-nums">
          {rate ? formatMoney(rate.value, 'ARS', { cents: !Number.isInteger(rate.value) }) : '—'}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className="size-1.5 rounded-full bg-success shadow-[0_0_0_3px_color-mix(in_oklch,var(--success)_25%,transparent)]" />
        {rate && <span className="text-[10px] text-muted-foreground tabular-nums">{formatTime(new Date(rate.at))}</span>}
      </span>
    </Link>
  )
}
