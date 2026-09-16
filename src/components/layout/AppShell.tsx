import { motion } from 'motion/react'
import { Suspense, useEffect, useLayoutEffect } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Skeleton } from '@/components/ui/skeleton'
import { useExpenseComposer } from '@/features/expenses/ExpenseComposer'
import { AmbientBackground } from './AmbientBackground'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { UserMenu } from './UserMenu'

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-14 w-56 rounded-2xl" />
      <Skeleton className="h-52 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
    </div>
  )
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]'))
}

export function AppShell() {
  const location = useLocation()
  const composer = useExpenseComposer()
  const [params, setParams] = useSearchParams()

  // The window is the scroller, so it keeps the previous tab's offset unless reset.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  // PWA home-screen shortcut: /?nuevo=1
  useEffect(() => {
    if (params.get('nuevo') !== '1') return
    composer.open()
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.delete('nuevo')
        return next
      },
      { replace: true },
    )
  }, [params, setParams, composer])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'n' || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      event.preventDefault()
      composer.open()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [composer])

  return (
    <div className="relative flex min-h-(--app-height) flex-col">
      <AmbientBackground />
      <Sidebar />

      <header className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+0.9rem)] pb-1 md:hidden">
        <Logo markClassName="h-8" />
        <UserMenu compact />
      </header>

      <div className="flex flex-1 flex-col md:pl-[17rem]">
        {/* Flex column all the way down so an empty page can fill the screen instead of scrolling. */}
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] sm:px-6 md:px-8 md:pt-10 md:pb-14 lg:px-10">
          <Suspense fallback={<PageSkeleton />}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-1 flex-col"
            >
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
