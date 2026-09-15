import type { Expense, ExpenseDraft, Subscription } from './types.js'

export function stripUndefined<T extends object>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined))
}

/** Works with Firestore Timestamps from both the web and admin SDKs. */
export function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return new Date(value as string | number)
}

/** Firestore stores JS Dates as Timestamps, so drafts can be written almost as-is. */
export function serializeExpense(draft: ExpenseDraft): Record<string, unknown> {
  const { id, installment, ...data } = draft
  void id
  return stripUndefined({ ...data, installment: installment && stripUndefined(installment) })
}

export function deserializeExpense(id: string, data: Record<string, unknown>): Expense {
  const expense = { ...data, id, date: toDate(data.date) } as Expense
  if (expense.installment) {
    expense.installment = { ...expense.installment, purchaseDate: toDate(expense.installment.purchaseDate) }
  }
  return expense
}

export function serializeSubscription(subscription: Subscription): Record<string, unknown> {
  const { id, ...data } = subscription
  void id
  return stripUndefined(data)
}
