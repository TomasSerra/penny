import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { computeBudget, emptyBudget } from '@shared/budget'
import { monthKeyOf } from '@shared/dates'
import type { UserSettings } from '@shared/types'
import { useSession } from '@/app/session'
import { Penny, type PennyPose } from '@/components/brand/Penny'
import { AmbientBackground } from '@/components/layout/AmbientBackground'
import { Button } from '@/components/ui/button'
import { saveBudget } from '@/data/budgets'
import { updateSettings } from '@/data/profile'
import { useExpenseComposer } from '@/features/expenses/ExpenseComposer'
import { cn } from '@/lib/utils'
import { newIncome, type OnboardingDraft } from './draft'
import { DoneStep } from './steps/DoneStep'
import { IncomeStep } from './steps/IncomeStep'
import { RateStep } from './steps/RateStep'
import { SavingsStep } from './steps/SavingsStep'
import { WelcomeStep } from './steps/WelcomeStep'

const EASE = [0.16, 1, 0.3, 1] as const

/** Welcome and the closing screen frame the flow; only the three middle ones count as steps. */
const POSES: PennyPose[] = ['base', 'rock', 'sunglasses', 'surprise', 'celebration']
const FIRST_STEP = 1
const LAST_STEP = 3
const DONE_STEP = LAST_STEP + 1
const TOTAL_STEPS = LAST_STEP - FIRST_STEP + 1

function Progress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: TOTAL_STEPS }, (_, index) => index + FIRST_STEP).map((value) => (
          <span
            key={value}
            className={cn(
              'h-2.5 rounded-full border-2 border-ink transition-all duration-300',
              value === step ? 'w-6 bg-penny' : value < step ? 'w-2.5 bg-penny' : 'w-2.5 bg-transparent opacity-40',
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        Paso {step} de {TOTAL_STEPS}
      </span>
    </div>
  )
}

export function OnboardingFlow({ onClose }: { onClose: () => void }) {
  const { uid, settings, rate } = useSession()
  const composer = useExpenseComposer()
  const navigate = useNavigate()
  const month = monthKeyOf(new Date())

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<OnboardingDraft>(() => ({
    incomes: [newIncome('Sueldo')],
    savings: { shortTermPct: 10, longTermPct: 10 },
    rate: settings.rate,
  }))

  const rateValue = rate?.value ?? 0
  const summary = useMemo(
    () => computeBudget({ ...emptyBudget(month), incomes: draft.incomes, savings: draft.savings }, rateValue),
    [month, draft.incomes, draft.savings, rateValue],
  )
  const hasIncome = summary.grossARS > 0

  function commitBudget() {
    const budget = { ...emptyBudget(month), incomes: draft.incomes, savings: draft.savings }
    saveBudget(uid, rate ? { ...budget, rateSnapshot: rate } : budget).catch((error: Error) =>
      toast.error('No se pudo guardar el presupuesto', { description: error.message }),
    )
  }

  function commitSettings(patch: Partial<UserSettings>) {
    updateSettings(uid, patch).catch((error: Error) => toast.error('No se pudo guardar', { description: error.message }))
  }

  // Each step saves as it is left, so closing the tab halfway does not lose what is already filled in.
  function next() {
    if (step === 2) commitBudget()
    if (step === 3) commitSettings({ rate: draft.rate })
    setStep(step + 1)
  }

  function finish(to?: string) {
    // The budget is written again: by now the quote comes from the rate chosen in step 3.
    commitBudget()
    commitSettings({ onboardedAt: new Date().toISOString() })
    onClose()
    if (to) navigate(to)
  }

  function skip() {
    commitSettings({ onboardingSkippedAt: new Date().toISOString() })
    onClose()
  }

  const blocked = step === 1 && !hasIncome

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && step < DONE_STEP) {
        event.preventDefault()
        skip()
        return
      }
      if (event.key !== 'Enter' || event.metaKey || event.ctrlKey) return
      // Anything focusable already does its own thing with Enter.
      if (event.target instanceof HTMLElement && event.target.closest('button, [role="slider"], [role="combobox"]')) return
      event.preventDefault()
      if (step === DONE_STEP) finish()
      else if (!blocked) next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // Re-bound whenever the closure would go stale; the handlers read the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, blocked, draft, rate])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background" role="dialog" aria-modal="true" aria-label="Configurar Penny">
      <AmbientBackground />
      <div className="mx-auto flex min-h-(--app-height) w-full max-w-lg flex-col justify-center px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="paper relative mt-16 rounded-4xl p-6 md:p-8">
          <Penny
            pose={POSES[step]}
            priority
            className="pointer-events-none absolute -top-[5.5rem] right-2 h-28 rotate-3 md:-top-24 md:right-5 md:h-32"
          />

          <div className="relative mb-6 flex h-8 items-center justify-between gap-3">
            {step > FIRST_STEP && step <= LAST_STEP ? (
              <Button variant="ghost" size="icon-sm" className="-ml-1.5 rounded-full" onClick={() => setStep(step - 1)} aria-label="Volver">
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              </Button>
            ) : (
              <span />
            )}
            {step >= FIRST_STEP && step <= LAST_STEP && <Progress step={step} />}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              {step === 0 && <WelcomeStep />}
              {step === 1 && (
                <IncomeStep items={draft.incomes} onChange={(incomes) => setDraft({ ...draft, incomes })} rate={rateValue} />
              )}
              {step === 2 && (
                <SavingsStep savings={draft.savings} onChange={(savings) => setDraft({ ...draft, savings })} summary={summary} />
              )}
              {step === 3 && <RateStep value={draft.rate} onChange={(next) => setDraft({ ...draft, rate: next })} />}
              {step === DONE_STEP && (
                <DoneStep
                  summary={summary}
                  onAddExpense={() => {
                    finish()
                    composer.open()
                  }}
                  onOpenApi={() => finish('/ajustes#api')}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="relative mt-7 flex items-center justify-between gap-3">
            {step < DONE_STEP ? (
              <>
                <Button variant="ghost" onClick={skip} className="text-muted-foreground">
                  Lo hago después
                </Button>
                <Button size="lg" onClick={next} disabled={blocked}>
                  {step === 0 ? 'Empezar' : step === LAST_STEP ? 'Terminar' : 'Siguiente'}
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.2} />
                </Button>
              </>
            ) : (
              <Button size="lg" className="ml-auto" onClick={() => finish()}>
                Entrar a Penny
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.2} />
              </Button>
            )}
          </div>

          {blocked && <p className="relative mt-3 text-right text-xs text-muted-foreground">Cargá cuánto entra por mes para seguir.</p>}
        </div>
      </div>
    </div>
  )
}
