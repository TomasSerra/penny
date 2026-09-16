import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { RouterProvider } from 'react-router/dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from './auth'
import { router } from './router'
import { ThemeProvider } from './theme'

// Keep toasts clear of the notch / status bar in the installed PWA.
const TOAST_OFFSET = { top: 'calc(env(safe-area-inset-top) + 16px)', right: 16, bottom: 16, left: 16 }

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={300}>
            <MotionConfig reducedMotion="user">
              <RouterProvider router={router} />
              <Toaster position="top-center" offset={TOAST_OFFSET} mobileOffset={TOAST_OFFSET} />
            </MotionConfig>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
