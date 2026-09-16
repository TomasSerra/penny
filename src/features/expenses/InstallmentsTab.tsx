import { Add01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { addMonths, monthKeyOf, monthsBetween } from '@shared/dates'
import { sum } from '@shared/money'
import type { Expense } from '@shared/types'
import { useSession } from '@/app/session'
import { CategoryTile } from '@/components/common/CategoryTile'
import { EmptyState, EmptyStateCard } from '@/components/common/EmptyState'
import { Money } from '@/components/common/Money'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useInstallmentPlans } from '@/data/expenses'
import { formatDate, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useExpenseComposer } from './ExpenseComposer'

interface Plan {
  first: Expense
  total: number
  paid: number
  lastMonth: string
  remainingARS: number
  active: boolean
}

function toPlan(first: Expense, current: string): Plan {
  const total = first.installment!.total
  const lastMonth = addMonths(first.month, total - 1)
  const paid = current < first.month ? 0 : Math.min(total, monthsBetween(first.month, current).length)
  return { first, total, paid, lastMonth, remainingARS: first.amountARS * (total - paid), active: lastMonth >= current }
}

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const composer = useExpenseComposer()
  const { first, total, paid } = plan
  const info = first.installment!

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => composer.open(first)}
      className={cn('paper flex w-full flex-col gap-4 rounded-3xl p-5 text-left transition-transform hover:-translate-y-0.5', !plan.active && 'opacity-60')}
    >
      <div className="flex items-start gap-3.5">
        <CategoryTile category={first.category} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{first.description}</p>
          <p className="text-xs text-muted-foreground">Comprado el {formatDate(info.purchaseDate, { day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="text-right">
          <Money value={info.totalAmount} currency={first.currency} className="font-semibold" />
          <p className="text-xs text-muted-foreground">total</p>
        </div>
      </div>

      {total <= 24 ? (
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < paid ? 'bg-penny' : 'bg-foreground/10')} />
          ))}
        </div>
      ) : (
        <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10" aria-hidden>
          <div className="h-full rounded-full bg-penny" style={{ width: `${(paid / total) * 100}%` }} />
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span>
          <span className="font-semibold tabular-nums">
            {paid}/{total}
          </span>{' '}
          <span className="text-muted-foreground">
            cuotas de <Money value={first.amount} currency={first.currency} />
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          {plan.active ? `Termina en ${formatMonth(plan.lastMonth, { year: true }).toLowerCase()}` : 'Terminada'}
        </span>
      </div>
    </motion.button>
  )
}

export function InstallmentsTab() {
  const { uid } = useSession()
  const composer = useExpenseComposer()
  const { data: firsts, loading } = useInstallmentPlans(uid)
  const current = monthKeyOf(new Date())

  const { active, finished } = useMemo(() => {
    const plans = firsts.map((first) => toPlan(first, current))
    return {
      active: plans.filter((plan) => plan.active).sort((a, b) => a.lastMonth.localeCompare(b.lastMonth)),
      finished: plans.filter((plan) => !plan.active).sort((a, b) => b.lastMonth.localeCompare(a.lastMonth)),
    }
  }, [firsts, current])

  if (loading) return <Skeleton className="h-40 rounded-3xl" />

  if (active.length === 0 && finished.length === 0) {
    return (
      <EmptyStateCard>
        <EmptyState
          pose="sunglasses"
          title="Sin compras en cuotas"
          description="Cargá un gasto con tarjeta de crédito y elegí en cuántas cuotas lo pagás. Acá vas a ver cuánto falta de cada plan y cuánto pesan este mes."
          action={
            <Button onClick={() => composer.open()}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} />
              Cargar una compra en cuotas
            </Button>
          }
        />
      </EmptyStateCard>
    )
  }

  const thisMonth = sum(active.filter((plan) => plan.first.month <= current).map((plan) => plan.first.amountARS))
  const remaining = sum(active.map((plan) => plan.remainingARS))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="paper rounded-3xl p-4 md:p-5">
          <p className="text-xs text-muted-foreground">Cuotas este mes</p>
          <Money value={thisMonth} animated className="mt-1 text-2xl font-semibold md:text-3xl" />
        </div>
        <div className="paper rounded-3xl p-4 md:p-5">
          <p className="text-xs text-muted-foreground">Falta pagar</p>
          <Money value={remaining} animated className="mt-1 text-2xl font-semibold md:text-3xl" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {active.map((plan, index) => (
          <PlanCard key={plan.first.id} plan={plan} index={index} />
        ))}
      </div>

      {finished.length > 0 && (
        <section>
          <h3 className="mb-2 px-2 text-sm font-medium text-muted-foreground">Terminadas</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {finished.map((plan, index) => (
              <PlanCard key={plan.first.id} plan={plan} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
