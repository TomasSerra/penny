import { Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AnimatePresence, motion } from 'motion/react'
import { createContext, useCallback, useContext, useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { CATEGORY_BY_ID } from '@shared/catalog'
import { buildExpenses } from '@shared/expenses'
import { MAX_INSTALLMENTS } from '@shared/normalize'
import { rateLabel } from '@shared/rates'
import type { CategoryId, Currency, Expense, PaymentMethodId } from '@shared/types'
import { useSession } from '@/app/session'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ResponsiveModal } from '@/components/common/ResponsiveModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createExpenses, deleteExpense, replaceExpense, updateExpense } from '@/data/expenses'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { amountToInput, formatAmountInput, parseAmountInput } from '@/lib/amountInput'
import { currencySymbol, formatMoney, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CategoryPicker, CurrencyToggle, DateField, FieldError, FieldLabel, NecessaryPicker, PaymentPicker, Stepper } from './fields'

const LAST_PAYMENT_KEY = 'penny-last-payment'
const QUICK_INSTALLMENTS = [1, 3, 6, 12]

interface ComposerContextValue {
  open: (expense?: Expense) => void
}

const ComposerContext = createContext<ComposerContextValue | null>(null)

export function ExpenseComposerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; expense?: Expense; key: number }>({ open: false, key: 0 })
  const open = useCallback((expense?: Expense) => setState((previous) => ({ open: true, expense, key: previous.key + 1 })), [])
  const value = useMemo(() => ({ open }), [open])

  return (
    <ComposerContext.Provider value={value}>
      {children}
      <ExpenseSheet
        key={state.key}
        open={state.open}
        expense={state.expense}
        onOpenChange={(next) => setState((previous) => ({ ...previous, open: next }))}
      />
    </ComposerContext.Provider>
  )
}

export function useExpenseComposer() {
  const context = useContext(ComposerContext)
  if (!context) throw new Error('useExpenseComposer must be used inside ExpenseComposerProvider')
  return context
}

function lastPaymentMethod(): PaymentMethodId {
  const stored = localStorage.getItem(LAST_PAYMENT_KEY)
  return stored === 'credit' || stored === 'debit' || stored === 'wallet' || stored === 'cash' ? stored : 'wallet'
}

interface ExpenseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense
}

function ExpenseSheet({ open, onOpenChange, expense }: ExpenseSheetProps) {
  const { uid, settings, rate } = useSession()
  const desktop = useIsDesktop()
  const formId = useId()
  const plan = expense?.installment

  const [groupId] = useState(() => plan?.groupId ?? crypto.randomUUID())
  const [amountText, setAmountText] = useState(() => (expense ? amountToInput(plan ? plan.totalAmount : expense.amount) : ''))
  const [currency, setCurrency] = useState<Currency>(expense?.currency ?? 'ARS')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [category, setCategory] = useState<CategoryId | null>(expense?.category ?? null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(expense?.paymentMethod ?? lastPaymentMethod)
  const [necessary, setNecessary] = useState(expense?.necessary ?? true)
  const [date, setDate] = useState<Date>(() => plan?.purchaseDate ?? expense?.date ?? new Date())
  const [installments, setInstallments] = useState(plan?.total ?? 1)
  const [showErrors, setShowErrors] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const amount = parseAmountInput(amountText)
  // Edits keep the quote the expense was recorded with, so history doesn't shift.
  const effectiveRate = expense?.rate ?? rate
  const count = paymentMethod === 'credit' ? installments : 1

  const drafts = useMemo(() => {
    if (!category || amount <= 0 || !effectiveRate) return []
    return buildExpenses(
      {
        date,
        amount,
        currency,
        description: description.trim() || CATEGORY_BY_ID[category].label,
        category,
        paymentMethod,
        necessary,
        installments: count,
      },
      { rate: effectiveRate, closingDay: settings.cardClosingDay, source: expense?.source ?? 'app', groupId },
    )
  }, [category, amount, effectiveRate, date, currency, description, paymentMethod, necessary, count, settings.cardClosingDay, expense?.source, groupId])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (drafts.length === 0 || !category) {
      setShowErrors(true)
      if (!effectiveRate) toast.error('Todavía no hay cotización del dólar, probá en unos segundos')
      return
    }

    const linked = drafts.map((draft) => ({ ...draft, subscriptionId: expense?.subscriptionId }))
    const request = !expense
      ? createExpenses(uid, linked)
      : !plan && linked.length === 1
        ? updateExpense(uid, expense.id, linked[0])
        : replaceExpense(uid, expense, linked)
    request.catch((error: Error) => toast.error('No se pudo guardar el gasto', { description: error.message }))

    localStorage.setItem(LAST_PAYMENT_KEY, paymentMethod)
    const item = CATEGORY_BY_ID[category]
    toast.success(expense ? 'Gasto actualizado' : 'Gasto cargado', {
      description: `${formatMoney(amount, currency)} · ${item.label}${count > 1 ? ` · ${count} cuotas` : ''}`,
    })
    onOpenChange(false)
  }

  function handleDelete() {
    if (!expense) return
    deleteExpense(uid, expense).catch((error: Error) => toast.error('No se pudo borrar', { description: error.message }))
    toast.success(plan ? 'Compra en cuotas borrada' : 'Gasto borrado')
    setConfirmDelete(false)
    onOpenChange(false)
  }

  const conversion =
    amount > 0 && effectiveRate
      ? currency === 'ARS'
        ? `≈ ${formatMoney(amount / effectiveRate.value, 'USD', { cents: true })}`
        : `≈ ${formatMoney(amount * effectiveRate.value)}`
      : null

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        title={expense ? 'Editar gasto' : 'Nuevo gasto'}
        footer={
          <div className="flex w-full gap-2">
            {expense && (
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                aria-label="Borrar gasto"
              >
                <HugeiconsIcon icon={Delete02Icon} />
              </Button>
            )}
            <Button type="submit" form={formId} size="lg" className="flex-1">
              {expense ? 'Guardar cambios' : 'Cargar gasto'}
            </Button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col items-center pt-1">
            <CurrencyToggle value={currency} onChange={setCurrency} />
            <label className="mt-3 flex w-full items-baseline justify-center gap-1.5">
              <span className="text-2xl font-medium text-muted-foreground">{currencySymbol(currency)}</span>
              <input
                autoFocus={desktop && !expense}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                aria-label="Monto"
                value={amountText}
                onChange={(event) => setAmountText(formatAmountInput(event.target.value, amountText))}
                style={{ width: `${Math.max(1, amountText.length) * 0.6 + 0.3}em` }}
                className="max-w-full min-w-[1ch] bg-transparent text-center text-[3.25rem] leading-none font-semibold tracking-tight tabular-nums caret-penny outline-none placeholder:text-muted-foreground/35"
              />
            </label>
            <p className="mt-2 h-4 text-xs text-muted-foreground tabular-nums">
              {conversion && (
                <>
                  {conversion} · {effectiveRate && rateLabel(effectiveRate)}
                </>
              )}
            </p>
            {showErrors && amount <= 0 && <FieldError>Ingresá un monto</FieldError>}
          </div>

          <div>
            <FieldLabel htmlFor={`${formId}-description`}>Descripción</FieldLabel>
            <Input
              id={`${formId}-description`}
              value={description}
              maxLength={200}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={category ? CATEGORY_BY_ID[category].label : '¿En qué gastaste?'}
            />
          </div>

          <div>
            <FieldLabel>Categoría</FieldLabel>
            <CategoryPicker value={category} onChange={setCategory} />
            {showErrors && !category && <FieldError>Elegí una categoría</FieldError>}
          </div>

          <div>
            <FieldLabel>Medio de pago</FieldLabel>
            <PaymentPicker value={paymentMethod} onChange={setPaymentMethod} />
          </div>

          <AnimatePresence initial={false}>
            {paymentMethod === 'credit' && (
              <motion.div
                key="installments"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="-mx-1 -mb-1.5 overflow-hidden px-1 pb-1.5"
              >
                <FieldLabel>Cuotas</FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  <Stepper label="Cantidad de cuotas" value={installments} onChange={setInstallments} min={1} max={MAX_INSTALLMENTS} />
                  {QUICK_INSTALLMENTS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setInstallments(option)}
                      className={cn(
                        'h-9 rounded-full px-3.5 text-sm font-medium tabular-nums transition-colors',
                        installments === option
                          ? 'border-2 border-ink-stamp bg-penny font-semibold text-ink-stamp'
                          : 'border-2 border-transparent text-muted-foreground hover:bg-accent',
                      )}
                    >
                      {option === 1 ? '1 pago' : option}
                    </button>
                  ))}
                </div>
                {count > 1 && drafts.length > 0 && (
                  <p className="mt-2.5 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">
                      {count} × {formatMoney(drafts[0].amount, currency, { cents: currency === 'USD' })}
                    </span>{' '}
                    · de {formatMonth(drafts[0].month).toLowerCase()} a {formatMonth(drafts[drafts.length - 1].month).toLowerCase()}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>¿Era necesario?</FieldLabel>
              <NecessaryPicker value={necessary} onChange={setNecessary} />
            </div>
            <div>
              <FieldLabel>{count > 1 ? 'Fecha de compra' : 'Fecha'}</FieldLabel>
              <DateField value={date} onChange={setDate} />
            </div>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={plan ? '¿Borrar la compra?' : '¿Borrar el gasto?'}
        description={
          plan
            ? `Se borran las ${plan.total} cuotas de “${expense?.description}”.`
            : expense?.subscriptionId
              ? 'Este cobro de la suscripción no se va a volver a generar.'
              : 'No se puede deshacer.'
        }
        confirmLabel="Borrar"
        destructive
        onConfirm={handleDelete}
      />
    </>
  )
}
