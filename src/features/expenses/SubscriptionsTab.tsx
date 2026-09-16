import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { CATEGORY_BY_ID, PAYMENT_METHOD_BY_ID } from '@shared/catalog'
import { addMonths, calendarParts, monthDiff, monthKeyOf } from '@shared/dates'
import { frequencyOf, nextChargeMonth } from '@shared/expenses'
import { sum, toARS } from '@shared/money'
import type { CategoryId, Currency, MonthKey, PaymentMethodId, Subscription, SubscriptionFrequency } from '@shared/types'
import { useSession } from '@/app/session'
import { CategoryTile } from '@/components/common/CategoryTile'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState, EmptyStateCard } from '@/components/common/EmptyState'
import { Money } from '@/components/common/Money'
import { ResponsiveModal } from '@/components/common/ResponsiveModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { deleteSubscription, newSubscriptionId, saveSubscription, useSubscriptions } from '@/data/subscriptions'
import { formatMonth, formatShortMonth } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CategoryPicker, CurrencyToggle, FieldError, FieldLabel, MoneyInput, NecessaryPicker, PaymentPicker } from './fields'

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1)

const FREQUENCIES: { value: SubscriptionFrequency; label: string }[] = [
  { value: 1, label: 'Mensual' },
  { value: 2, label: 'Bimestral' },
  { value: 3, label: 'Trimestral' },
  { value: 6, label: 'Semestral' },
  { value: 12, label: 'Anual' },
]

const FREQUENCY_LABEL = Object.fromEntries(FREQUENCIES.map((item) => [item.value, item.label])) as Record<SubscriptionFrequency, string>

/** The next charge can be any month of the first cycle; monthly ones still get to pick this month or the next. */
const anchorOptions = (current: MonthKey, frequency: SubscriptionFrequency) =>
  Array.from({ length: Math.max(frequency, 2) }, (_, index) => addMonths(current, index))

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
  const currentMonth = monthKeyOf(new Date())
  const initialFrequency = subscription ? frequencyOf(subscription) : 1
  const initialAnchor = subscription ? nextChargeMonth(subscription, currentMonth) : currentMonth
  const [name, setName] = useState(subscription?.name ?? '')
  const [amount, setAmount] = useState(subscription?.amount ?? 0)
  const [currency, setCurrency] = useState<Currency>(subscription?.currency ?? 'ARS')
  const [category, setCategory] = useState<CategoryId | null>(subscription?.category ?? 'entertainment')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(subscription?.paymentMethod ?? 'credit')
  const [necessary, setNecessary] = useState(subscription?.necessary ?? false)
  const [dayOfMonth, setDayOfMonth] = useState(subscription?.dayOfMonth ?? today)
  const [frequency, setFrequency] = useState<SubscriptionFrequency>(initialFrequency)
  const [anchor, setAnchor] = useState<MonthKey>(initialAnchor)
  const [active, setActive] = useState(subscription?.active ?? true)
  const [showErrors, setShowErrors] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const chargesNow = anchor === currentMonth && dayOfMonth < today

  function changeFrequency(next: SubscriptionFrequency) {
    setFrequency(next)
    if (monthDiff(currentMonth, anchor) >= anchorOptions(currentMonth, next).length) setAnchor(currentMonth)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || amount <= 0 || !category) {
      setShowErrors(true)
      return
    }
    // Untouched schedules keep their original start, so past charges stay part of the same cycle.
    const unchanged = subscription && anchor === initialAnchor && frequency === initialFrequency
    const next: Subscription = {
      id: subscription?.id ?? newSubscriptionId(uid),
      name: name.trim(),
      amount,
      currency,
      category,
      paymentMethod,
      necessary,
      dayOfMonth,
      frequencyMonths: frequency,
      active,
      startMonth: unchanged ? subscription.startMonth : anchor,
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
        description="Se carga sola como gasto fijo en los meses en que se cobra."
        className="lg:max-w-[60rem]"
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
        {/* Two columns on wide screens so the whole form fits without scrolling. */}
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-10">
          <div className="flex flex-col gap-5">
            <div>
              <FieldLabel htmlFor={`${formId}-name`}>Nombre</FieldLabel>
              <Input id={`${formId}-name`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Netflix, Spotify, gimnasio…" />
              {showErrors && !name.trim() && <FieldError>Poné un nombre</FieldError>}
            </div>

            <div>
              <FieldLabel htmlFor={`${formId}-amount`}>{frequency === 1 ? 'Monto mensual' : 'Monto por cobro'}</FieldLabel>
              <div className="flex gap-2">
                <MoneyInput id={`${formId}-amount`} value={amount} onChange={setAmount} currency={currency} className="flex-1" />
                <CurrencyToggle value={currency} onChange={setCurrency} size="md" />
              </div>
              {showErrors && amount <= 0 && <FieldError>Ingresá un monto</FieldError>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Frecuencia</FieldLabel>
                <Select value={String(frequency)} onValueChange={(value) => changeFrequency(Number(value) as SubscriptionFrequency)}>
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {FREQUENCIES.map((item) => (
                      <SelectItem key={item.value} value={String(item.value)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              </div>
            </div>

            <div>
              <FieldLabel>{subscription ? 'Próximo cobro' : 'Primer cobro'}</FieldLabel>
              <Select value={anchor} onValueChange={setAnchor}>
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-2xl">
                  {anchorOptions(currentMonth, frequency).map((month) => (
                    <SelectItem key={month} value={month}>
                      {formatMonth(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!subscription && chargesNow && (
                <p className="mt-2 text-xs text-muted-foreground">El día ya pasó: el cobro de este mes se registra al guardar.</p>
              )}
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
          </div>

          <div className="flex flex-col gap-5">
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
          </div>
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
    subscriptions.filter((item) => item.active).map((item) => toARS(item.amount, item.currency, rate?.value ?? 0) / frequencyOf(item)),
  )
  const currentMonth = monthKeyOf(new Date())
  const today = calendarParts(new Date()).day

  return (
    <div className="flex flex-1 flex-col space-y-5">
      {loading ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : subscriptions.length === 0 ? (
        <EmptyStateCard>
          <EmptyState
            pose="base"
            title="Sin suscripciones"
            description="Agregá Netflix, el gimnasio, un seguro anual o lo que pagues cada tantos meses y se carga solo como gasto fijo."
            action={
              <Button onClick={() => openSheet()}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} />
                Nueva suscripción
              </Button>
            }
          />
        </EmptyStateCard>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <div className="paper-flat rounded-3xl p-4 md:p-5">
              <p className="text-xs text-muted-foreground">Por mes en suscripciones, en promedio</p>
              <Money value={monthlyTotal} animated className="mt-1 text-2xl font-semibold md:text-3xl" />
            </div>
            <Button variant="outline" onClick={() => openSheet()}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} />
              Nueva
            </Button>
          </div>

          <div className="paper-flat divide-y divide-border overflow-hidden rounded-3xl">
            {subscriptions.map((subscription, index) => {
              const payment = PAYMENT_METHOD_BY_ID[subscription.paymentMethod]
              const frequency = frequencyOf(subscription)
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
                        {FREQUENCY_LABEL[frequency]}
                        {frequency > 1 && subscription.active && ` · próx. ${formatShortMonth(nextChargeMonth(subscription, subscription.dayOfMonth < today ? addMonths(currentMonth, 1) : currentMonth))}`} · Día{' '}
                        {subscription.dayOfMonth} · {CATEGORY_BY_ID[subscription.category]?.label} · {payment?.emoji} {payment?.label}
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
