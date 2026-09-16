import { deleteDoc, limit, onSnapshot, orderBy, query, runTransaction, setDoc, where } from 'firebase/firestore'
import { copyBudget } from '@shared/budget'
import { addMonths, monthsBetween } from '@shared/dates'
import { stripUndefined } from '@shared/serialize'
import type { Budget, MonthKey, RateSnapshot } from '@shared/types'
import { db } from '@/lib/firebase'
import { budgetRef, budgetsCol } from './refs'
import { useLive } from './useSubscription'

/** Pass `enabled: false` to skip the listener entirely (see `useLive`). */
export function useBudget(uid: string, month: MonthKey, { enabled = true }: { enabled?: boolean } = {}) {
  return useLive<Budget | null>(
    enabled ? `budget:${uid}:${month}` : null,
    (onData, onError) =>
      onSnapshot(budgetRef(uid, month), (snapshot) => onData(snapshot.exists() ? (snapshot.data() as Budget) : null), onError),
    null,
  )
}

/** Most recent budget before `month`, used to offer "copy from previous". */
export function usePreviousBudget(uid: string, month: MonthKey, { enabled = true }: { enabled?: boolean } = {}) {
  return useLive<Budget | null>(
    enabled ? `budget-prev:${uid}:${month}` : null,
    (onData, onError) =>
      onSnapshot(
        query(budgetsCol(uid), where('month', '<', month), orderBy('month', 'desc'), limit(1)),
        (snapshot) => onData(snapshot.empty ? null : (snapshot.docs[0].data() as Budget)),
        onError,
      ),
    null,
  )
}

export function saveBudget(uid: string, budget: Budget) {
  return setDoc(budgetRef(uid, budget.month), stripUndefined(budget))
}

export function deleteBudget(uid: string, month: MonthKey) {
  return deleteDoc(budgetRef(uid, month))
}

/**
 * Every month from the one after `latest` up to `month` starts as a copy of `latest`.
 * Saved as its own document, so later edits to `latest` no longer reach it.
 * Checked in a transaction: another device may have created or edited one meanwhile.
 */
export function carryOverBudget(uid: string, latest: Budget, month: MonthKey, rate: RateSnapshot | undefined) {
  const months = monthsBetween(addMonths(latest.month, 1), month)
  return runTransaction(db, async (transaction) => {
    const snapshots = await Promise.all(months.map((key) => transaction.get(budgetRef(uid, key))))
    snapshots.forEach((snapshot, index) => {
      if (snapshot.exists()) return
      const copy = copyBudget(latest, months[index])
      transaction.set(snapshot.ref, stripUndefined(rate ? { ...copy, rateSnapshot: rate } : copy))
    })
  })
}
