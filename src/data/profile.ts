import type { User } from 'firebase/auth'
import { getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { DEFAULT_SETTINGS, type RateSnapshot, type UserSettings } from '@shared/types'
import { apiKeyRef, userRef } from './refs'
import { useLive } from './useSubscription'

export interface UserProfile {
  displayName?: string
  email?: string
  settings: UserSettings
  lastRate?: RateSnapshot
}

export async function ensureProfile(user: User): Promise<void> {
  const ref = userRef(user.uid)
  const snapshot = await getDoc(ref)
  if (snapshot.exists()) return
  await setDoc(ref, {
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    settings: DEFAULT_SETTINGS,
    createdAt: serverTimestamp(),
  })
}

export function useProfile(uid: string) {
  return useLive<UserProfile | null>(
    `profile:${uid}`,
    (onData, onError) =>
      onSnapshot(
        userRef(uid),
        (snapshot) => {
          const data = snapshot.data()
          onData(data ? ({ ...data, settings: { ...DEFAULT_SETTINGS, ...data.settings } } as UserProfile) : null)
        },
        onError,
      ),
    null,
  )
}

export function updateSettings(uid: string, settings: Partial<UserSettings>) {
  const fields = Object.fromEntries(Object.entries(settings).map(([key, value]) => [`settings.${key}`, value]))
  return updateDoc(userRef(uid), fields)
}

/** Cached server-side as a fallback when dolarapi is unavailable for the public API. */
export function saveLastRate(uid: string, rate: RateSnapshot) {
  return updateDoc(userRef(uid), { lastRate: rate })
}

export function useApiKey(uid: string) {
  return useLive<string | null>(
    `apiKey:${uid}`,
    (onData, onError) => onSnapshot(apiKeyRef(uid), (snapshot) => onData(snapshot.get('key') ?? null), onError),
    null,
  )
}

export async function rotateApiKey(user: User): Promise<string> {
  const token = await user.getIdToken()
  const response = await fetch('/api/keys/rotate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  const body = (await response.json().catch(() => ({}))) as { key?: string; error?: string }
  if (!response.ok || !body.key) throw new Error(body.error ?? 'No se pudo generar la API key')
  return body.key
}
