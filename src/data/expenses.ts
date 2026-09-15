import {
  arrayUnion,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type QuerySnapshot,
} from 'firebase/firestore'
import { deserializeExpense, serializeExpense } from '@shared/serialize'
import type { Expense, ExpenseDraft, MonthKey } from '@shared/types'
import { db } from '@/lib/firebase'
import { expenseRef, expensesCol, subscriptionRef } from './refs'
import { useLive } from './useSubscription'

const EMPTY: Expense[] = []

function mapExpenses(snapshot: QuerySnapshot): Expense[] {
  return snapshot.docs
    .map((doc) => deserializeExpense(doc.id, doc.data()))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

/** Sorting happens client-side so no composite indexes are needed. */
export function useMonthExpenses(uid: string, month: MonthKey) {
  return useLive(
    `expenses:${uid}:${month}`,
    (onData, onError) =>
      onSnapshot(query(expensesCol(uid), where('month', '==', month)), (s) => onData(mapExpenses(s)), onError),
    EMPTY,
  )
}

export function useExpensesBetween(uid: string, from: MonthKey, to: MonthKey) {
  return useLive(
    `expenses:${uid}:${from}:${to}`,
    (onData, onError) =>
      onSnapshot(
        query(expensesCol(uid), where('month', '>=', from), where('month', '<=', to), orderBy('month')),
        (s) => onData(mapExpenses(s)),
        onError,
      ),
    EMPTY,
  )
}

/** First installment of every purchase in installments; the rest of the plan is derived from it. */
export function useInstallmentPlans(uid: string) {
  return useLive(
    `installments:${uid}`,
    (onData, onError) =>
      onSnapshot(query(expensesCol(uid), where('installment.number', '==', 1)), (s) => onData(mapExpenses(s)), onError),
    EMPTY,
  )
}

function withTimestamps(draft: ExpenseDraft, isNew: boolean) {
  return {
    ...serializeExpense(draft),
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  }
}

/**
 * Writes resolve only once the server acknowledges them, so callers should not
 * block the UI on them: the local cache updates listeners immediately.
 */
export function createExpenses(uid: string, drafts: ExpenseDraft[]) {
  const batch = writeBatch(db)
  for (const draft of drafts) {
    const ref = draft.id ? expenseRef(uid, draft.id) : expenseRef(uid, crypto.randomUUID())
    batch.set(ref, withTimestamps(draft, true))
  }
  return batch.commit()
}

export function updateExpense(uid: string, id: string, draft: ExpenseDraft) {
  const batch = writeBatch(db)
  batch.set(expenseRef(uid, id), withTimestamps(draft, false), { merge: true })
  return batch.commit()
}

async function installmentDocs(uid: string, groupId: string) {
  return (await getDocs(query(expensesCol(uid), where('installment.groupId', '==', groupId)))).docs
}

export async function deleteExpense(uid: string, expense: Expense) {
  const batch = writeBatch(db)
  if (expense.installment) {
    for (const doc of await installmentDocs(uid, expense.installment.groupId)) batch.delete(doc.ref)
  } else {
    batch.delete(expenseRef(uid, expense.id))
  }
  const commit = batch.commit()
  if (expense.subscriptionId) {
    // Remember the deletion so the subscription sync does not recreate it.
    void updateDoc(subscriptionRef(uid, expense.subscriptionId), { skippedMonths: arrayUnion(expense.month) }).catch(() => {})
  }
  return commit
}

/** Used when an edit changes the number of documents (e.g. a purchase moved to or from installments). */
export async function replaceExpense(uid: string, original: Expense, drafts: ExpenseDraft[]) {
  const batch = writeBatch(db)
  if (original.installment) {
    for (const doc of await installmentDocs(uid, original.installment.groupId)) batch.delete(doc.ref)
  } else {
    batch.delete(expenseRef(uid, original.id))
  }
  for (const draft of drafts) batch.set(expenseRef(uid, crypto.randomUUID()), withTimestamps(draft, true))
  return batch.commit()
}
