import { Navigate, useLocation } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ExpenseComposerProvider } from '@/features/expenses/ExpenseComposer'
import { OnboardingProvider } from '@/features/onboarding/OnboardingProvider'
import { useAuth } from './auth'
import { SessionProvider } from './session'
import { SplashScreen } from './SplashScreen'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <SplashScreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return (
    <SessionProvider>
      <ExpenseComposerProvider>
        <OnboardingProvider>
          <AppShell />
        </OnboardingProvider>
      </ExpenseComposerProvider>
    </SessionProvider>
  )
}
