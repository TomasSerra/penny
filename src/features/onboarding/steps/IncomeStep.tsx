import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AnimatePresence, motion } from 'motion/react'
import { sum, toARS } from '@shared/money'
import type { MoneyItem } from '@shared/types'
import { Money } from '@/components/common/Money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyToggle, MoneyInput } from '@/features/expenses/fields'
import { newIncome } from '../draft'

export function IncomeStep({
  items,
  onChange,
  rate,
}: {
  items: MoneyItem[]
  onChange: (items: MoneyItem[]) => void
  rate: number
}) {
  const total = sum(items.map((item) => toARS(item.amount, item.currency, rate)))
  const update = (id: string, patch: Partial<MoneyItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  return (
    <div>
      <h1 className="font-display text-3xl leading-tight text-balance">¿Cuánto entra por mes?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Tu sueldo y todo lo que cobres seguido. Si cobrás en dólares, cambiá la moneda y yo lo convierto.
      </p>

      <div className="mt-5">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="-mx-1 overflow-hidden px-1"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1.5">
                <Input
                  value={item.name}
                  onChange={(event) => update(item.id, { name: event.target.value })}
                  placeholder="Sueldo"
                  aria-label="Nombre del ingreso"
                  className="col-span-2"
                />
                <MoneyInput
                  value={item.amount}
                  currency={item.currency}
                  onChange={(amount) => update(item.id, { amount })}
                  ariaLabel={`Monto de ${item.name || 'el ingreso'}`}
                />
                <div className="flex items-center gap-1">
                  <CurrencyToggle value={item.currency} onChange={(currency) => update(item.id, { currency })} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => onChange(items.filter((other) => other.id !== item.id))}
                    aria-label="Quitar ingreso"
                    disabled={items.length === 1}
                  >
                    <HugeiconsIcon icon={Delete02Icon} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Button variant="ghost" size="sm" className="mt-2 text-penny-ink" onClick={() => onChange([...items, newIncome()])}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} />
        Agregar otro ingreso
      </Button>

      <div className="mt-5 flex items-baseline justify-between gap-3 rounded-3xl bg-foreground/[0.03] px-4 py-3.5 dark:bg-white/[0.03]">
        <span className="text-sm text-muted-foreground">Total por mes</span>
        <Money value={total} className="text-xl font-semibold" />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Los descuentos (monotributo, impuestos) y los gastos fijos los cargás después en Presupuesto, cuando quieras.
      </p>
    </div>
  )
}
