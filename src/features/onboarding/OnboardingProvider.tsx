import { AnimatePresence, motion } from 'motion/react'
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { monthKeyOf } from '@shared/dates'
import { useSession } from '@/app/session'
import { SplashScreen } from '@/app/SplashScreen'
import { useBudget } from '@/data/budgets'
import { OnboardingFlow } from './OnboardingFlow'

interface OnboardingContextValue {
  /** The account still has nothing set up: the dashboard keeps offering the flow. */
  needsSetup: boolean
  open: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { uid, profile, profileLoading, settings } = useSession()
  const month = monthKeyOf(new Date())
  const done = Boolean(settings.onboardedAt)
  const postponed = Boolean(settings.onboardingSkippedAt)
  // Only an account with no onboarding mark needs this read to know whether it is a fresh one.
  const { data: budget, loading: budgetLoading } = useBudget(uid, month, { enabled: !done && !postponed })
  // How it was opened decides whether it fades in: coming from the splash there is nothing
  // to fade from, and a fade would show the dashboard underneath for a moment.
  const [open, setOpen] = useState<'auto' | 'manual' | null>(null)
  const autoOpened = useRef(false)

  const profileReady = !profileLoading && profile !== null
  const decided = profileReady && (done || postponed || !budgetLoading)
  const needsSetup = decided && !done && (postponed || !budget)

  // Before the first paint, so a new account never sees the dashboard flash behind the flow.
  useLayoutEffect(() => {
    if (autoOpened.current || !needsSetup || postponed) return
    autoOpened.current = true
    setOpen('auto')
  }, [needsSetup, postponed])

  const value = useMemo(() => ({ needsSetup, open: () => setOpen('manual') }), [needsSetup])
  const close = useCallback(() => setOpen(null), [])

  return (
    <OnboardingContext.Provider value={value}>
      {/* Hold everything until we know: landing on the dashboard only to be pulled into the
          flow a second later reads as a glitch. */}
      {decided ? children : <SplashScreen />}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={open === 'manual' ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <OnboardingFlow onClose={close} />
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) throw new Error('useOnboarding must be used inside OnboardingProvider')
  return context
}
