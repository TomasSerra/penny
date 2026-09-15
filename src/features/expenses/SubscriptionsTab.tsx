import { Add01Icon, Delete02Icon, RepeatIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { CATEGORY_BY_ID, PAYMENT_METHOD_BY_ID } from '@shared/catalog'
import { addMonths, calendarParts, monthKeyOf } from '@shared/dates'
import { sum, toARS } from '@shared/money'
import type { CategoryId, Currency, PaymentMethodId, Subscription } from '@shared/types'
import { useSession } from '@/app/session'
import { CategoryTile } from '@/components/common/CategoryTile'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { Money } from '@/components/common/Money'
import { ResponsiveModal } from '@/components/common/ResponsiveModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { deleteSubscription, newSubscriptionId, saveSubscription, useSubscriptions } from '@/data/subscriptions'
import { cn } from '@/lib/utils'
import { CategoryPicker, CurrencyToggle, FieldError, FieldLabel, MoneyInput, NecessaryPicker, PaymentPicker } from './fields'

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1)

function SubscriptionSheet({
  open,
  onOpenChange,
  subscription,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription?: Subscription
}) {
  const { uid } = useSession()
  const formId = useId()
  const today = calendarParts(new Date()).day
  const [name, setName] = useState(subscription?.name ?? '')
  const [amount, setAmount] = useState(subscription?.amount ?? 0)
  const [currency, setCurrency] = useState<Currency>(subscription?.currency ?? 'ARS')
  const [category, setCategory] = useState<CategoryId | null>(subscription?.category ?? 'entertainment')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(subscription?.paymentMethod ?? 'credit')
  const [necessary, setNecessary] = useState(subscription?.necessary ?? false)
  const [dayOfMonth, setDayOfMonth] = useState(subscription?.dayOfMonth ?? today)
  const [active, setActive] = useState(subscription?.active ?? true)
  const [chargeThisMonth, setChargeThisMonth] = useState(true)
  const [showErrors, setShowErrors] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const alreadyDue = !subscription && dayOfMonth <= today

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || amount <= 0 || !category) {
      setShowErrors(true)
      return
    }
    const currentMonth = monthKeyOf(new Date())
    const next: Subscription = {
      id: subscription?.id ?? newSubscriptionId(uid),
      name: name.trim(),
      amount,
      currency,
      category,
      paymentMethod,
      necessary,
      dayOfMonth,
      active,
      startMonth: subscription?.startMonth ?? (alreadyDue && !chargeThisMonth ? addMonths(currentMonth, 1) : currentMonth),
      skippedMonths: subscription?.skippedMonths,
    }
    saveSubscription(uid, next).catch((error: Error) => toast.error('No se pudo guardar', { description: error.message }))
    toast.success(subscription ? 'Suscripción actualizada' : 'Suscripción creada')
    onOpenChange(false)
  }

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        title={subscription ? 'Editar suscripción' : 'Nueva suscripción'}
        description="Se carga sola como gasto todos los meses en el día elegido."
        footer={
          <div className="flex w-full gap-2">
            {subscription && (
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                aria-label="Borrar suscripción"
              >
                <HugeiconsIcon icon={Delete02Icon} />
              </Button>
            )}
            <Button type="submit" form={formId} size="lg" className="flex-1">
              Guardar
            </Button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <FieldLabel htmlFor={`${formId}-name`}>Nombre</FieldLabel>
            <Input id={`${formId}-name`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Netflix, Spotify, gimnasio…" />
            {showErrors && !name.trim() && <FieldError>Poné un nombre</FieldError>}
          </div>

          <div>
            <FieldLabel htmlFor={`${formId}-amount`}>Monto mensual</FieldLabel>
            <div className="flex gap-2">
              <MoneyInput id={`${formId}-amount`} value={amount} onChange={setAmount} currency={currency} className="flex-1" />
              <CurrencyToggle value={currency} onChange={setCurrency} size="md" />
            </div>
            {showErrors && amount <= 0 && <FieldError>Ingresá un monto</FieldError>}
          </div>

          <div>
            <FieldLabel>Día de cobro</FieldLabel>
            <Select value={String(dayOfMonth)} onValueChange={(value) => setDayOfMonth(Number(value))}>
              <SelectTrigger className="h-11 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72 rounded-2xl">
                {DAYS.map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    Día {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {alreadyDue && (
              <label className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Registrar el cobro de este mes</span>
                <Switch checked={chargeThisMonth} onCheckedChange={setChargeThisMonth} />
              </label>
            )}
          </div>

          <div>
            <FieldLabel>Categoría</FieldLabel>
            <CategoryPicker value={category} onChange={setCategory} />
          </div>

          <div>
            <FieldLabel>Medio de pago</FieldLabel>
            <PaymentPicker value={paymentMethod} onChange={setPaymentMethod} />
          </div>

          <div>
            <FieldLabel>¿Es necesario?</FieldLabel>
            <NecessaryPicker value={necessary} onChange={setNecessary} />
          </div>

          {subscription && (
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="block font-medium">Activa</span>
                <span className="text-muted-foreground">Pausala para dejar de generar el gasto.</span>
              </span>
              <Switch checked={active} onCheckedChange={setActive} />
            </label>
          )}
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Borrar la suscripción?"
        description="Los gastos que ya se generaron quedan en tu historial."
        confirmLabel="Borrar"
        destructive
        onConfirm={() => {
          if (!subscription) return
          deleteSubscription(uid, subscription.id).catch(() => toast.error('No se pudo borrar'))
          setConfirmDelete(false)
          onOpenChange(false)
        }}
      />
    </>
  )
}

export function SubscriptionsTab() {
  const { uid, rate } = useSession()
  const { data: subscriptions, loading } = useSubscriptions(uid)
  const [sheet, setSheet] = useState<{ open: boolean; subscription?: Subscription; key: number }>({ open: false, key: 0 })

  const openSheet = (subscription?: Subscription) => setSheet((previous) => ({ open: true, subscription, key: previous.key + 1 }))
  const monthlyTotal = sum(
    subscriptions.filter((item) => item.active).map((item) => toARS(item.amount, item.currency, rate?.value ?? 0)),
  )

  return (
    <div className="space-y-5">
      {loading ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : subscriptions.length === 0 ? (
        <div className="glass rounded-4xl">
          <EmptyState
            icon={RepeatIcon}
            title="Sin suscripciones"
            description="Agregá Netflix, Spotify, el gimnasio o lo que pagues todos los meses y se carga solo."
            action={
              <Button onClick={() => openSheet()}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} />
                Nueva suscripción
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <div className="glass rounded-3xl p-4 md:p-5">
              <p className="text-xs text-muted-foreground">Por mes en suscripciones</p>
              <Money value={monthlyTotal} animated className="mt-1 text-2xl font-semibold md:text-3xl" />
            </div>
            <Button variant="outline" onClick={() => openSheet()}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} />
              Nueva
            </Button>
          </div>

          <div className="glass divide-y divide-border overflow-hidden rounded-3xl">
            {subscriptions.map((subscription, index) => {
              const payment = PAYMENT_METHOD_BY_ID[subscription.paymentMethod]
              return (
                <motion.div
                  key={subscription.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                  className={cn('flex items-center gap-3.5 px-4 py-3 transition-opacity', !subscription.active && 'opacity-55')}
                >
                  <button type="button" onClick={() => openSheet(subscription)} className="flex min-w-0 flex-1 items-center gap-3.5 text-left outline-none">
                    <CategoryTile category={subscription.category} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{subscription.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        Día {subscription.dayOfMonth} · {CATEGORY_BY_ID[subscription.category]?.label} · {payment?.emoji} {payment?.label}
                      </span>
                    </span>
                    <span className="flex flex-col items-end">
                      <Money value={subscription.amount} currency={subscription.currency} className="font-semibold" cents={subscription.currency === 'USD'} />
                      {subscription.currency === 'USD' && rate && (
                        <Money value={subscription.amount * rate.value} className="text-xs text-muted-foreground" />
                      )}
                    </span>
                  </button>
                  <Switch
                    checked={subscription.active}
                    aria-label={subscription.active ? 'Pausar' : 'Activar'}
                    onCheckedChange={(checked) =>
                      saveSubscription(uid, { ...subscription, active: checked }).catch(() => toast.error('No se pudo actualizar'))
                    }
                  />
                </motion.div>
              )
            })}
          </div>
        </>
      )}

      <SubscriptionSheet
        key={sheet.key}
        open={sheet.open}
        subscription={sheet.subscription}
        onOpenChange={(open) => setSheet((previous) => ({ ...previous, open }))}
      />
    </div>
  )
}
