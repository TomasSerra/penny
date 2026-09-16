import { Add01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { NavLink } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { useExpenseComposer } from '@/features/expenses/ExpenseComposer'
import { useMonthSearch } from '@/hooks/useMonthParam'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, NAV_SPRING } from './nav'
import { RateChip } from './RateChip'
import { UserMenu } from './UserMenu'

export function Sidebar() {
  const composer = useExpenseComposer()
  const search = useMonthSearch()

  return (
    <aside className="paper fixed inset-y-3 left-3 z-40 hidden w-64 flex-col rounded-[1.75rem] p-3 md:flex">
      <div className="px-3 pt-3 pb-7">
        <Logo />
      </div>

      <Button size="lg" className="mx-0.5 justify-between" onClick={() => composer.open()}>
        <span className="flex items-center gap-2">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} />
          Nuevo gasto
        </span>
        <kbd className="rounded-md bg-black/10 px-1.5 py-0.5 font-sans text-[11px] font-semibold">N</kbd>
      </Button>

      <nav className="mt-6 flex flex-col gap-1" aria-label="Principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={{ pathname: item.to, search }}
            end={item.to === '/'}
            className="relative flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl border-2 border-ink bg-penny/20"
                    transition={NAV_SPRING}
                  />
                )}
                <HugeiconsIcon
                  icon={item.icon}
                  strokeWidth={isActive ? 2 : 1.6}
                  className={cn('relative size-5 transition-colors', isActive && 'text-penny-ink')}
                />
                <span className={cn('relative', isActive && 'text-foreground')}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <RateChip />
        <UserMenu />
      </div>
    </aside>
  )
}
