import { ClosingDaySelect } from '@/features/settings/fields'

export function CardStep({ value, onChange }: { value: number; onChange: (day: number) => void }) {
  return (
    <div>
      <h1 className="font-display text-3xl leading-tight text-balance">¿Cuándo cierra tu tarjeta?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Es el día en que la tarjeta arma el resumen. Lo necesito para poner cada cuota en el mes en que la vas a pagar
        de verdad, y no en el que compraste.
      </p>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-3xl bg-foreground/[0.03] px-4 py-3.5 dark:bg-white/[0.03]">
        <span className="text-sm font-medium">Día de cierre</span>
        <ClosingDaySelect value={value} onChange={onChange} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Si comprás en cuotas después del día {value}, la primera cuota te la voy a contar en el mes siguiente.
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        Lo encontrás en el resumen de tu tarjeta o en el home banking. Si no usás tarjeta, dejalo como está y seguí.
      </p>
    </div>
  )
}
