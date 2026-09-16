import { Link } from 'react-router'
import { rateLabel } from '@shared/rates'
import { useSession } from '@/app/session'
import { formatMoney, formatTime } from '@/lib/format'

export function RateChip() {
  const { settings, rate } = useSession()
  return (
    <Link
      to="/ajustes#dolar"
      className="group flex items-center justify-between rounded-2xl border-2 border-ink px-3.5 py-3 transition-colors hover:bg-accent"
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
        <span className="size-2 rounded-full border border-ink bg-success" />
        {rate && <span className="text-[10px] text-muted-foreground tabular-nums">{formatTime(new Date(rate.at))}</span>}
      </span>
    </Link>
  )
}
