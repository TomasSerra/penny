import { Add01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { NavLink } from 'react-router'
import { useExpenseComposer } from '@/features/expenses/ExpenseComposer'
import { useMonthSearch } from '@/hooks/useMonthParam'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, NAV_SPRING } from './nav'

function BottomNavItem({ item, search }: { item: (typeof NAV_ITEMS)[number]; search: string }) {
  return (
    <NavLink
      to={{ pathname: item.to, search }}
      end={item.to === '/'}
      className="relative flex h-full flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-medium outline-none"
    >
      {({ isActive }) => (
        <>
          <span className="relative grid h-8 w-12 place-items-center">
            {isActive && (
              <motion.span
                layoutId="bottom-nav-active"
                className="absolute inset-0 rounded-full bg-foreground/[0.07] dark:bg-white/10"
                transition={NAV_SPRING}
              />
            )}
            <HugeiconsIcon
              icon={item.icon}
              strokeWidth={isActive ? 2 : 1.6}
              className={cn('relative size-[22px] transition-colors', isActive ? 'text-penny-ink' : 'text-muted-foreground')}
            />
          </span>
          <span className={cn('transition-colors', isActive ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

export function BottomNav() {
  const composer = useExpenseComposer()
  const search = useMonthSearch()
  const [first, second, third, fourth] = NAV_ITEMS

  return (
    <nav
      aria-label="Principal"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden"
    >
      <div className="glass-strong pointer-events-auto flex h-[4.5rem] w-full max-w-md items-center rounded-full px-1.5">
        <BottomNavItem item={first} search={search} />
        <BottomNavItem item={second} search={search} />
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.3 }}
          onClick={() => composer.open()}
          aria-label="Nuevo gasto"
          className="coin mx-1 grid size-14 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-6" strokeWidth={2.4} />
        </motion.button>
        <BottomNavItem item={third} search={search} />
        <BottomNavItem item={fourth} search={search} />
      </div>
    </nav>
  )
}
