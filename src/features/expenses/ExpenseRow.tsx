import { RepeatIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'
import { CATEGORY_BY_ID, PAYMENT_METHOD_BY_ID } from '@shared/catalog'
import type { Expense } from '@shared/types'
import { CategoryTile } from '@/components/common/CategoryTile'
import { Money } from '@/components/common/Money'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useExpenseComposer } from './ExpenseComposer'

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-foreground/[0.05] px-2 text-[10.5px] font-medium text-foreground/75 dark:bg-white/[0.07]', className)}>
      {children}
    </span>
  )
}

export function ExpenseRow({
  expense,
  index = 0,
  showDate,
  compact,
}: {
  expense: Expense
  index?: number
  showDate?: string
  /** For narrow cards: date and category only, no tags */
  compact?: boolean
}) {
  const composer = useExpenseComposer()
  const category = CATEGORY_BY_ID[expense.category]
  const payment = PAYMENT_METHOD_BY_ID[expense.paymentMethod]

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 12) * 0.025, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => composer.open(expense)}
      className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors outline-none hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.04] active:bg-foreground/[0.05]"
    >
      <CategoryTile category={expense.category} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{expense.description}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">
            {showDate ? `${showDate} · ` : ''}
            {category?.label}
            {!compact && ` · ${payment?.emoji} ${payment?.label}`}
          </span>
          {compact ? null : expense.installment && (
            <Tag>
              Cuota {expense.installment.number}/{expense.installment.total}
            </Tag>
          )}
          {!compact && expense.purchaseDate && (
            <Tag>Compra {formatDate(expense.purchaseDate, { day: 'numeric', month: 'short' })}</Tag>
          )}
          {!compact && expense.subscriptionId && (
            <Tag>
              <HugeiconsIcon icon={RepeatIcon} className="size-3" strokeWidth={2} />
              <span className="hidden sm:inline">Suscripción</span>
            </Tag>
          )}
          {!compact && expense.source === 'api' && <Tag className="hidden sm:inline-flex">Atajo</Tag>}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <Money value={expense.amountARS} tabular className="font-semibold" />
        {expense.currency === 'USD' ? (
          <Money value={expense.amount} currency="USD" tabular cents={!Number.isInteger(expense.amount)} className="text-xs text-muted-foreground" />
        ) : (
          !expense.necessary && <span className="text-[11px] font-medium text-copper">No necesario</span>
        )}
      </span>
    </motion.button>
  )
}
