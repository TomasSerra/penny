import type { User } from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, type RateSnapshot, type UserSettings } from '@shared/types'
import { saveLastRate, useProfile, type UserProfile } from '@/data/profile'
import { useRate } from '@/data/rates'
import { syncSubscriptions, useSubscriptions } from '@/data/subscriptions'
import { useUser } from './auth'
import { useTheme } from './theme'

interface Session {
  user: User
  uid: string
  profile: UserProfile | null
  profileLoading: boolean
  settings: UserSettings
  /** Live quote for the user's configured exchange rate */
  rate: RateSnapshot | undefined
}

const SessionContext = createContext<Session | null>(null)

const SIX_HOURS = 6 * 60 * 60 * 1000

export function SessionProvider({ children }: { children: ReactNode }) {
  const user = useUser()
  const uid = user.uid
  const { data: profile, loading: profileLoading } = useProfile(uid)
  const settings = profile?.settings ?? DEFAULT_SETTINGS
  const rate = useRate(settings.rate)
  const { data: subscriptions, loading: subscriptionsLoading } = useSubscriptions(uid)
  const { setPreference } = useTheme()

  // Keep a recent quote on the profile: the public API falls back to it if dolarapi is down.
  const lastRate = profile?.lastRate
  useEffect(() => {
    if (!rate || !profile) return
    const stale =
      !lastRate ||
      lastRate.type !== rate.type ||
      lastRate.side !== rate.side ||
      Date.now() - new Date(lastRate.at).getTime() > SIX_HOURS
    if (stale) saveLastRate(uid, rate).catch(() => {})
  }, [uid, rate, profile, lastRate])

  useEffect(() => {
    if (subscriptionsLoading || !rate || subscriptions.length === 0) return
    syncSubscriptions(uid, subscriptions, rate).catch((error) => console.warn('[subscriptions] sync', error))
    // Re-run when subscriptions change or the quote type changes, not on every quote refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, subscriptions, subscriptionsLoading, rate?.type, Boolean(rate)])

  // A new device adopts the theme saved on the account.
  const themeAdopted = useRef(false)
  useEffect(() => {
    if (themeAdopted.current || !profile) return
    themeAdopted.current = true
    if (!localStorage.getItem('penny-theme')) setPreference(profile.settings.theme)
  }, [profile, setPreference])

  const value = useMemo(
    () => ({ user, uid, profile, profileLoading, settings, rate }),
    [user, uid, profile, profileLoading, settings, rate],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside SessionProvider')
  return session
}
