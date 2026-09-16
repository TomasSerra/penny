import { RATE_SIDES } from '@shared/rates'
import type { RateConfig, RateSide } from '@shared/types'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { RatePicker } from '@/features/settings/fields'

export function RateStep({ value, onChange }: { value: RateConfig; onChange: (rate: RateConfig) => void }) {
  return (
    <div>
      <h1 className="font-display text-3xl leading-tight text-balance">¿Qué dólar usás?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Lo uso para pasar a pesos lo que cargues en dólares, y para mostrarte todo en las dos monedas. Elegí el que
        mirás vos; se actualiza solo todos los días.
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Precio de</span>
        <SegmentedControl<RateSide>
          size="sm"
          value={value.side}
          onChange={(side) => onChange({ ...value, side })}
          options={RATE_SIDES.map((item) => ({ value: item.id, label: item.label }))}
        />
      </div>

      <RatePicker value={value} onChange={onChange} className="mt-4" />
    </div>
  )
}
