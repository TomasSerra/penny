import { arDate, daysInMonth, monthKeyOf, parseMonthKey } from './dates.js'
import { splitInstallments } from './installments.js'
import { round2, toARS, toUSD } from './money.js'
import type { ExpenseInput } from './normalize.js'
import type { ExpenseDraft, ExpenseSource, MonthKey, RateSnapshot, Subscription } from './types.js'

export interface BuildContext {
  rate: RateSnapshot
  closingDay: number
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

/** Turns one purchase into the expense documents to store (one per installment). */
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

  if (input.installments <= 1 || input.paymentMethod !== 'credit') {
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

  const purchaseMonth = monthKeyOf(input.date)
  return splitInstallments(input.amount, input.installments, input.date, context.closingDay).map((slice) => ({
    ...base,
    // Installments in later statements are dated the 1st of their month, so they never look like future spending.
    date: slice.month === purchaseMonth ? input.date : startOfMonth(slice.month),
    month: slice.month,
    amount: slice.amount,
    ...amounts(slice.amount, input, context.rate),
    installment: {
      groupId: context.groupId,
      number: slice.number,
      total: input.installments,
      totalAmount: round2(input.amount),
      purchaseDate: input.date,
    },
  }))
}

export function subscriptionExpenseId(subscriptionId: string, month: MonthKey): string {
  return `sub_${subscriptionId}_${month.replace('-', '')}`
}

export function subscriptionChargeDate(subscription: Pick<Subscription, 'dayOfMonth'>, month: MonthKey): Date {
  const { year, month: monthNumber } = parseMonthKey(month)
  return arDate(year, monthNumber, Math.min(subscription.dayOfMonth, daysInMonth(year, monthNumber)), 12)
}

/** Months (oldest first) whose charge is already due and could still be missing. */
export function dueSubscriptionMonths(subscription: Subscription, today: Date, lookbackMonths = 2): MonthKey[] {
  if (!subscription.active) return []
  const current = monthKeyOf(today)
  const months: MonthKey[] = []
  for (let offset = lookbackMonths; offset >= 0; offset--) {
    const { year, month } = parseMonthKey(current)
    const key = monthKeyOf(arDate(year, month - offset, 1))
    if (key < subscription.startMonth || subscription.skippedMonths?.includes(key)) continue
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
