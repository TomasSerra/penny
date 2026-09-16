import type { BudgetSummary } from '@shared/budget'
import type { Savings } from '@shared/types'
import { Money } from '@/components/common/Money'
import { Slider } from '@/components/ui/slider'
import { formatMoney } from '@/lib/format'

function SavingsRow({ label, hint, value, amount, onChange }: { label: string; hint: string; value: number; amount: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm">
          <span className="font-semibold tabular-nums">{value}%</span>
          <span className="ml-2 text-muted-foreground">{formatMoney(amount)}</span>
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{hint}</p>
      <Slider value={[value]} min={0} max={100} step={1} onValueChange={([next]) => onChange(next)} aria-label={label} />
    </div>
  )
}

export function SavingsStep({
  savings,
  onChange,
  summary,
}: {
  savings: Savings
  onChange: (savings: Savings) => void
  summary: BudgetSummary
}) {
  return (
    <div>
      <h1 className="font-display text-3xl leading-tight text-balance">¿Cuánto querés ahorrar?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Un porcentaje de lo que entra. Lo aparto primero y lo que queda es tu plata para gastar en el mes.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <SavingsRow
          label="Corto plazo"
          hint="El colchón para un imprevisto o algo que querés comprar pronto."
          value={savings.shortTermPct}
          amount={summary.shortTermARS}
          onChange={(shortTermPct) => onChange({ ...savings, shortTermPct })}
        />
        <SavingsRow
          label="Largo plazo"
          hint="Lo que no pensás tocar: inversión, un auto, un viaje grande."
          value={savings.longTermPct}
          amount={summary.longTermARS}
          onChange={(longTermPct) => onChange({ ...savings, longTermPct })}
        />
      </div>

      <div className="mt-6 rounded-3xl bg-foreground/[0.03] px-4 py-3.5 dark:bg-white/[0.03]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">Te queda para gastar</span>
          <Money
            value={summary.variableARS}
            className={summary.overAllocated ? 'text-xl font-semibold text-destructive' : 'text-xl font-semibold'}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {summary.overAllocated
            ? 'Estás ahorrando más de lo que entra. Bajá un poco los porcentajes.'
            : 'Esto es lo que voy a vigilar todos los días para avisarte si vas muy rápido.'}
        </p>
      </div>
    </div>
  )
}
