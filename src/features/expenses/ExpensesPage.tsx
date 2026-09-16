import { Add01Icon, CreditCardIcon, ReceiptIcon, RepeatIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useSearchParams } from 'react-router'
import { MonthPicker } from '@/components/common/MonthPicker'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useMonthParam } from '@/hooks/useMonthParam'
import { useExpenseComposer } from './ExpenseComposer'
import { InstallmentsTab } from './InstallmentsTab'
import { MovementsTab } from './MovementsTab'
import { SubscriptionsTab } from './SubscriptionsTab'

const TABS = ['movimientos', 'cuotas', 'suscripciones'] as const
type Tab = (typeof TABS)[number]

// Three labelled tabs plus their icons only fit a 375px screen at a smaller size.
const TAB_TRIGGER = 'gap-1.5 px-2 text-xs sm:px-4 sm:text-sm'
const TAB_ICON = 'size-3.5 sm:size-4'

export default function ExpensesPage() {
  const [params, setParams] = useSearchParams()
  const [month, setMonth] = useMonthParam()
  const composer = useExpenseComposer()
  const desktop = useIsDesktop()
  const raw = params.get('tab')
  const tab: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : 'movimientos'

  const setTab = (next: string) =>
    setParams(
      (previous) => {
        const updated = new URLSearchParams(previous)
        if (next === 'movimientos') updated.delete('tab')
        else updated.set('tab', next)
        return updated
      },
      { replace: true },
    )

  return (
    <>
      {/* On a phone the month lives in the movements summary and the add button in the nav bar,
          so the header is just the title. */}
      <PageHeader
        title="Gastos"
        eyebrow={desktop ? 'Todo lo que sale, en un solo lugar' : undefined}
        className="mb-5"
        actions={
          desktop && (
            <>
              {tab === 'movimientos' && <MonthPicker month={month} onChange={setMonth} />}
              <Button className="h-11" onClick={() => composer.open()}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} />
                Nuevo gasto
              </Button>
            </>
          )
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="flex-1 gap-5">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="movimientos" className={TAB_TRIGGER}>
            <HugeiconsIcon icon={ReceiptIcon} className={TAB_ICON} strokeWidth={2} />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="cuotas" className={TAB_TRIGGER}>
            <HugeiconsIcon icon={CreditCardIcon} className={TAB_ICON} strokeWidth={2} />
            Cuotas
          </TabsTrigger>
          <TabsTrigger value="suscripciones" className={TAB_TRIGGER}>
            <HugeiconsIcon icon={RepeatIcon} className={TAB_ICON} strokeWidth={2} />
            Suscripciones
          </TabsTrigger>
        </TabsList>
        <TabsContent value="movimientos" className="flex flex-col">
          <MovementsTab month={month} onMonthChange={setMonth} />
        </TabsContent>
        <TabsContent value="cuotas" className="flex flex-col">
          <InstallmentsTab />
        </TabsContent>
        <TabsContent value="suscripciones" className="flex flex-col">
          <SubscriptionsTab />
        </TabsContent>
      </Tabs>
    </>
  )
}
