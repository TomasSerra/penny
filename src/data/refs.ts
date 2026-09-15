import { collection, doc } from 'firebase/firestore'
import type { MonthKey } from '@shared/types'
import { db } from '@/lib/firebase'

export const userRef = (uid: string) => doc(db, 'users', uid)
export const apiKeyRef = (uid: string) => doc(db, 'users', uid, 'private', 'apiKey')
export const expensesCol = (uid: string) => collection(db, 'users', uid, 'expenses')
export const expenseRef = (uid: string, id: string) => doc(db, 'users', uid, 'expenses', id)
export const budgetsCol = (uid: string) => collection(db, 'users', uid, 'budgets')
export const budgetRef = (uid: string, month: MonthKey) => doc(db, 'users', uid, 'budgets', month)
export const subscriptionsCol = (uid: string) => collection(db, 'users', uid, 'subscriptions')
export const subscriptionRef = (uid: string, id: string) => doc(db, 'users', uid, 'subscriptions', id)

export const newId = (uid: string) => doc(expensesCol(uid)).id
