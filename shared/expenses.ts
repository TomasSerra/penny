import { addMonths, arDate, daysInMonth, monthDiff, monthKeyOf, parseMonthKey } from './dates.js'
import { splitInstallments } from './installments.js'
import { round2, toARS, toUSD } from './money.js'
import type { ExpenseInput } from './normalize.js'
import type { Currency, Expense, ExpenseDraft, ExpenseSource, MonthKey, RateSnapshot, Subscription } from './types.js'

export interface BuildContext {
  rate: RateSnapshot
  source: ExpenseSource
  /** Shared id for all the installments of one purchase */
  groupId: string
}

function startOfMonth(month: MonthKey): Date {
  const { year, month: monthNumber } = parseMonthKey(month)
  return arDate(year, monthNumber, 1, 12)
}

function amounts(amount: number, input: Pick<ExpenseInput, 'currency'>, rate: RateSnapshot) {
  return {
    amountARS: round2(toARS(amount, input.currency, rate.value)),
    amountUSD: round2(toUSD(amount, input.currency, rate.value)),
  }
}

/**
 * Turns one purchase into the expense documents to store. Credit card purchases
 * land in the month they are paid (the next one or the one after, as chosen),
 * dated on its 1st, with one document per installment.
 */
export function buildExpenses(input: ExpenseInput, context: BuildContext): ExpenseDraft[] {
  const base = {
    currency: input.currency,
    rate: context.rate,
    description: input.description,
    category: input.category,
    paymentMethod: input.paymentMethod,
    necessary: input.necessary,
    source: context.source,
  }

  if (input.paymentMethod !== 'credit') {
    return [
      {
        ...base,
        date: input.date,
        month: monthKeyOf(input.date),
        amount: round2(input.amount),
        ...amounts(input.amount, input, context.rate),
      },
    ]
  }

  const firstMonth = addMonths(monthKeyOf(input.date), input.cardMonthOffset)
  const count = Math.max(1, input.installments)
  return splitInstallments(input.amount, count, firstMonth).map((slice) => ({
    ...base,
    date: startOfMonth(slice.month),
    month: slice.month,
    amount: slice.amount,
    ...amounts(slice.amount, input, context.rate),
    purchaseDate: input.date,
    installment:
      count > 1
        ? {
            groupId: context.groupId,
            number: slice.number,
            total: count,
            totalAmount: round2(input.amount),
            purchaseDate: input.date,
          }
        : undefined,
  }))
}

export function subscriptionExpenseId(subscriptionId: string, month: MonthKey): string {
  return `sub_${subscriptionId}_${month.replace('-', '')}`
}

export function subscriptionChargeDate(subscription: Pick<Subscription, 'dayOfMonth'>, month: MonthKey): Date {
  const { year, month: monthNumber } = parseMonthKey(month)
  return arDate(year, monthNumber, Math.min(subscription.dayOfMonth, daysInMonth(year, monthNumber)), 12)
}

export const frequencyOf = (subscription: Pick<Subscription, 'frequencyMonths'>) => subscription.frequencyMonths ?? 1

export function chargesInMonth(subscription: Pick<Subscription, 'startMonth' | 'frequencyMonths'>, month: MonthKey): boolean {
  const diff = monthDiff(subscription.startMonth, month)
  return diff >= 0 && diff % frequencyOf(subscription) === 0
}

/** First charge month on or after `from`. */
export function nextChargeMonth(subscription: Pick<Subscription, 'startMonth' | 'frequencyMonths'>, from: MonthKey): MonthKey {
  const diff = monthDiff(subscription.startMonth, from)
  if (diff <= 0) return subscription.startMonth
  const frequency = frequencyOf(subscription)
  return addMonths(subscription.startMonth, Math.ceil(diff / frequency) * frequency)
}

/** Months (oldest first) whose charge is already due and could still be missing. */
export function dueSubscriptionMonths(subscription: Subscription, today: Date, lookbackMonths = 2): MonthKey[] {
  if (!subscription.active) return []
  const current = monthKeyOf(today)
  const months: MonthKey[] = []
  for (let offset = lookbackMonths; offset >= 0; offset--) {
    const { year, month } = parseMonthKey(current)
    const key = monthKeyOf(arDate(year, month - offset, 1))
    if (!chargesInMonth(subscription, key) || subscription.skippedMonths?.includes(key)) continue
    if (subscriptionChargeDate(subscription, key).getTime() <= today.getTime()) months.push(key)
  }
  return months
}

export function buildSubscriptionExpense(subscription: Subscription, month: MonthKey, rate: RateSnapshot): ExpenseDraft {
  return {
    id: subscriptionExpenseId(subscription.id, month),
    date: subscriptionChargeDate(subscription, month),
    month,
    amount: round2(subscription.amount),
    currency: subscription.currency,
    rate,
    ...amounts(subscription.amount, subscription, rate),
    description: subscription.name,
    category: subscription.category,
    paymentMethod: subscription.paymentMethod,
    necessary: subscription.necessary,
    source: 'subscription',
    subscriptionId: subscription.id,
  }
}

export interface SubscriptionCharge {
  subscriptionId: string
  name: string
  amount: number
  currency: Currency
  amountARS: number
  /** Not generated yet, so it is estimated with the given quote */
  projected: boolean
}

/**
 * Subscription charges that impact a month, which count as fixed expenses.
 * Generated expenses count as recorded; charges still to come in the current
 * or a future month are projected from the active subscriptions.
 */
export function subscriptionChargesForMonth(
  subscriptions: Subscription[],
  monthExpenses: Expense[],
  month: MonthKey,
  rate: number,
  today: Date = new Date(),
): SubscriptionCharge[] {
  const charges: SubscriptionCharge[] = monthExpenses
    .filter((expense) => expense.month === month && expense.subscriptionId)
    .map((expense) => ({
      subscriptionId: expense.subscriptionId!,
      name: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      amountARS: expense.amountARS,
      projected: false,
    }))
  if (month < monthKeyOf(today)) return charges

  const recorded = new Set(charges.map((charge) => charge.subscriptionId))
  for (const subscription of subscriptions) {
    if (!subscription.active || recorded.has(subscription.id) || subscription.skippedMonths?.includes(month)) continue
    if (!chargesInMonth(subscription, month)) continue
    charges.push({
      subscriptionId: subscription.id,
      name: subscription.name,
      amount: subscription.amount,
      currency: subscription.currency,
      amountARS: round2(toARS(subscription.amount, subscription.currency, rate)),
      projected: true,
    })
  }
  return charges
}
