import { CreditCardIcon, DollarCircleIcon, WalletAdd01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'

const AGENDA: { icon: IconSvgElement; title: string; detail: string }[] = [
  { icon: WalletAdd01Icon, title: 'Tu presupuesto', detail: 'Cuánto entra por mes y cuánto querés ahorrar.' },
  { icon: DollarCircleIcon, title: 'El dólar', detail: 'Con qué cotización convierto pesos y dólares.' },
  { icon: CreditCardIcon, title: 'Tu tarjeta', detail: 'Cuándo cierra el resumen, para ubicar las cuotas.' },
]

export function WelcomeStep() {
  return (
    <div>
      <h1 className="font-display text-3xl leading-tight text-balance">Hola, soy Penny</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Te ayudo a saber cuánto podés gastar sin quedarte corto a fin de mes. Antes de arrancar necesito tres cosas, y te
        explico para qué sirve cada una.
      </p>

      <ul className="mt-6 flex flex-col gap-2.5">
        {AGENDA.map((item, index) => (
          <li key={item.title} className="flex items-center gap-3.5 rounded-3xl bg-foreground/[0.03] p-3.5 dark:bg-white/[0.03]">
            <span className="coin grid size-10 shrink-0 place-items-center rounded-2xl font-display text-base">{index + 1}</span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <HugeiconsIcon icon={item.icon} className="size-4 text-penny-ink" strokeWidth={2} />
                {item.title}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{item.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs text-muted-foreground">Es un minuto y después podés cambiar todo desde Ajustes.</p>
    </div>
  )
}
