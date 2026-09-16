import { Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AnimatePresence, motion } from 'motion/react'
import { createContext, useCallback, useContext, useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { CATEGORY_BY_ID } from '@shared/catalog'
import { addMonths, monthDiff, monthKeyOf } from '@shared/dates'
import { buildExpenses } from '@shared/expenses'
import { MAX_INSTALLMENTS } from '@shared/normalize'
import { rateLabel } from '@shared/rates'
import type { CardMonthOffset, CategoryId, Currency, Expense, PaymentMethodId } from '@shared/types'
import { useSession } from '@/app/session'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { ResponsiveModal } from '@/components/common/ResponsiveModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createExpenses, deleteExpense, replaceExpense, updateExpense } from '@/data/expenses'
import { useIsDesktop, useMediaQuery } from '@/hooks/useMediaQuery'
import { amountToInput, formatAmountInput, parseAmountInput } from '@/lib/amountInput'
import { currencySymbol, formatMoney, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CategoryPicker, CurrencyToggle, DateField, FieldError, FieldLabel, NecessaryPicker, PaymentPicker, Stepper } from './fields'

const LAST_PAYMENT_KEY = 'penny-last-payment'
const LAST_CARD_OFFSET_KEY = 'penny-last-card-offset'
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

const lastCardOffset = (): CardMonthOffset => (localStorage.getItem(LAST_CARD_OFFSET_KEY) === '2' ? 2 : 1)

/** Offset of an existing credit expense, from its purchase to the month its first installment is paid. */
function cardOffsetOf(expense: Expense): CardMonthOffset | undefined {
  const purchaseDate = expense.installment?.purchaseDate ?? expense.purchaseDate
  if (expense.paymentMethod !== 'credit' || !purchaseDate) return undefined
  const firstMonth = addMonths(expense.month, -((expense.installment?.number ?? 1) - 1))
  return monthDiff(monthKeyOf(purchaseDate), firstMonth) >= 2 ? 2 : 1
}

interface ExpenseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense
}

function ExpenseSheet({ open, onOpenChange, expense }: ExpenseSheetProps) {
  const { uid, rate } = useSession()
  const desktop = useIsDesktop()
  // Matches the form's two-column breakpoint (lg).
  const wide = useMediaQuery('(min-width: 1024px)')
  const formId = useId()
  const plan = expense?.installment

  const [groupId] = useState(() => plan?.groupId ?? crypto.randomUUID())
  const [amountText, setAmountText] = useState(() => (expense ? amountToInput(plan ? plan.totalAmount : expense.amount) : ''))
  const [currency, setCurrency] = useState<Currency>(expense?.currency ?? 'ARS')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [category, setCategory] = useState<CategoryId | null>(expense?.category ?? null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(expense?.paymentMethod ?? lastPaymentMethod)
  const [necessary, setNecessary] = useState(expense?.necessary ?? true)
  const [date, setDate] = useState<Date>(() => plan?.purchaseDate ?? expense?.purchaseDate ?? expense?.date ?? new Date())
  const [cardMonthOffset, setCardMonthOffset] = useState<CardMonthOffset>(() => (expense && cardOffsetOf(expense)) || lastCardOffset())
  const [installments, setInstallments] = useState(plan?.total ?? 1)
  const [showErrors, setShowErrors] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const amount = parseAmountInput(amountText)
  // Edits keep the quote the expense was recorded with, so history doesn't shift.
  const effectiveRate = expense?.rate ?? rate
  const credit = paymentMethod === 'credit'
  const count = credit ? installments : 1

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
        cardMonthOffset,
      },
      { rate: effectiveRate, source: expense?.source ?? 'app', groupId },
    )
  }, [category, amount, effectiveRate, date, currency, description, paymentMethod, necessary, count, cardMonthOffset, expense?.source, groupId])

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
    if (paymentMethod === 'credit') localStorage.setItem(LAST_CARD_OFFSET_KEY, String(cardMonthOffset))
    const item = CATEGORY_BY_ID[category]
    toast.success(expense ? 'Gasto actualizado' : 'Gasto cargado', {
      description: `${formatMoney(amount, currency)} · ${item.label}${count > 1 ? ` · ${count} cuotas` : ''}${
        paymentMethod === 'credit' ? ` · se paga en ${formatMonth(drafts[0].month, { year: false }).toLowerCase()}` : ''
      }`,
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

  // Which statement the purchase lands on. On wide screens it sits under the purchase date it depends on.
  const necessaryField = (
    <div>
      <FieldLabel>¿Era necesario?</FieldLabel>
      <NecessaryPicker value={necessary} onChange={setNecessary} stretch={!wide} />
    </div>
  )

  const payMonthField = (
    <>
      <FieldLabel>¿Cuándo lo pagás?</FieldLabel>
      <SegmentedControl<string>
        stretch
        value={String(cardMonthOffset)}
        onChange={(value) => setCardMonthOffset(value === '2' ? 2 : 1)}
        options={([1, 2] as const).map((offset) => ({
          value: String(offset),
          label: formatMonth(addMonths(monthKeyOf(date), offset), { year: false }),
        }))}
      />
      <p className="mt-2 text-xs text-muted-foreground">El gasto cuenta en el mes en que lo pagás, no en el de la compra.</p>
    </>
  )

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
        className="lg:max-w-[62rem]"
        footer={
          <div className="flex w-full gap-2 lg:justify-end">
            {expense && (
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive lg:mr-auto"
                onClick={() => setConfirmDelete(true)}
                aria-label="Borrar gasto"
              >
                <HugeiconsIcon icon={Delete02Icon} />
              </Button>
            )}
            <Button type="submit" form={formId} size="lg" className="flex-1 lg:w-56 lg:flex-none">
              {expense ? 'Guardar cambios' : 'Cargar gasto'}
            </Button>
          </div>
        }
      >
        {/*
          Phone: one column in DOM order. Wide screens: a tinted summary panel on the left (amount,
          description, and the defaulted fields at its foot) beside the pickers, so nothing needs scrolling.
        */}
        <form
          id={formId}
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:grid-rows-[1fr_auto_auto] lg:gap-x-8 lg:gap-y-0"
        >
          <div aria-hidden className="hidden rounded-3xl bg-muted lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:block" />

          <div className="flex flex-col items-center pt-1 lg:col-start-1 lg:row-start-1 lg:self-center lg:px-5 lg:py-6">
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

          <div className="lg:col-start-1 lg:row-start-2 lg:px-5">
            <FieldLabel htmlFor={`${formId}-description`}>Descripción</FieldLabel>
            <Input
              id={`${formId}-description`}
              value={description}
              maxLength={200}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={category ? CATEGORY_BY_ID[category].label : '¿En qué gastaste?'}
            />
          </div>

          <div className="flex flex-col gap-5 lg:col-start-2 lg:row-span-3 lg:row-start-1">
            <div>
              <FieldLabel>Categoría</FieldLabel>
              <CategoryPicker value={category} onChange={setCategory} className="lg:grid-cols-8" />
              {showErrors && !category && <FieldError>Elegí una categoría</FieldError>}
            </div>

            <div>
              <FieldLabel>Medio de pago</FieldLabel>
              <PaymentPicker value={paymentMethod} onChange={setPaymentMethod} />
            </div>

            <AnimatePresence initial={false}>
              {credit && (
                <motion.div
                  key="installments"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="-mx-1 -mb-1.5 overflow-hidden px-1 pb-1.5"
                >
                  {!wide && <div className="mb-5">{payMonthField}</div>}
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

            {wide && necessaryField}
          </div>

          <div className="lg:col-start-1 lg:row-start-3 lg:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {!wide && necessaryField}
              <div>
                <FieldLabel>{credit ? 'Fecha de compra' : 'Fecha'}</FieldLabel>
                <DateField value={date} onChange={setDate} />
              </div>
            </div>
            {wide && (
              <AnimatePresence initial={false}>
                {credit && (
                  <motion.div
                    key="pay-month"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="-mx-1 -mb-1.5 overflow-hidden px-1 pb-1.5"
                  >
                    <div className="pt-4">{payMonthField}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
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
