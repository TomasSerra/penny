import { motion } from 'motion/react'
import { Navigate, useLocation } from 'react-router'
import { LogoMark } from '@/components/brand/Logo'
import { AppShell } from '@/components/layout/AppShell'
import { ExpenseComposerProvider } from '@/features/expenses/ExpenseComposer'
import { useAuth } from './auth'
import { SessionProvider } from './session'

export function SplashScreen() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: [0.96, 1, 0.96] }}
        transition={{ opacity: { duration: 0.4 }, scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <LogoMark className="size-14" />
      </motion.div>
    </div>
  )
}

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <SplashScreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return (
    <SessionProvider>
      <ExpenseComposerProvider>
        <AppShell />
      </ExpenseComposerProvider>
    </SessionProvider>
  )
}
