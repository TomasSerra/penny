import { deleteDoc, limit, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore'
import { stripUndefined } from '@shared/serialize'
import type { Budget, MonthKey } from '@shared/types'
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
export function usePreviousBudget(uid: string, month: MonthKey) {
  return useLive<Budget | null>(
    `budget-prev:${uid}:${month}`,
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
