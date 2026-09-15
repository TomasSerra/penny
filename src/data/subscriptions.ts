import { deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { buildSubscriptionExpense, dueSubscriptionMonths } from '@shared/expenses'
import { serializeExpense, serializeSubscription } from '@shared/serialize'
import type { RateSnapshot, Subscription } from '@shared/types'
import { expenseRef, subscriptionRef, subscriptionsCol } from './refs'
import { useLive } from './useSubscription'

const EMPTY: Subscription[] = []

export function useSubscriptions(uid: string) {
  return useLive(
    `subscriptions:${uid}`,
    (onData, onError) =>
      onSnapshot(
        subscriptionsCol(uid),
        (snapshot) =>
          onData(
            snapshot.docs
              .map((d) => ({ ...(d.data() as Omit<Subscription, 'id'>), id: d.id }))
              .sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.name.localeCompare(b.name)),
          ),
        onError,
      ),
    EMPTY,
  )
}

export const newSubscriptionId = (uid: string) => doc(subscriptionsCol(uid)).id

export function saveSubscription(uid: string, subscription: Subscription) {
  return setDoc(subscriptionRef(uid, subscription.id), serializeSubscription(subscription))
}

export function deleteSubscription(uid: string, id: string) {
  return deleteDoc(subscriptionRef(uid, id))
}

/**
 * Materializes due subscription charges as expenses. Ids are deterministic so
 * running this on every app open (or from several devices) never duplicates.
 */
export async function syncSubscriptions(uid: string, subscriptions: Subscription[], rate: RateSnapshot, today = new Date()) {
  let created = 0
  for (const subscription of subscriptions) {
    for (const month of dueSubscriptionMonths(subscription, today)) {
      const draft = buildSubscriptionExpense(subscription, month, rate)
      const ref = expenseRef(uid, draft.id!)
      try {
        if ((await getDoc(ref)).exists()) continue
      } catch {
        continue // offline without cache: try again next time
      }
      void setDoc(ref, { ...serializeExpense(draft), createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      created++
    }
  }
  return created
}
