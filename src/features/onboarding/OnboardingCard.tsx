import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Penny } from '@/components/brand/Penny'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOnboarding } from './OnboardingProvider'

/** The dashboard's standing offer to finish the setup, for whoever postponed it. */
export function OnboardingCard({ className }: { className?: string }) {
  const { open } = useOnboarding()

  return (
    <section className={cn('paper-flat relative flex flex-col items-start justify-center rounded-4xl p-6 md:p-8', className)}>
      <Penny
        pose="surprise"
        className="pointer-events-none absolute -top-10 right-1 h-24 -rotate-3 sm:-top-8 sm:right-4 sm:h-28 md:-top-6 md:right-8 md:h-32"
      />
      <h2 className="relative font-display text-3xl leading-tight">Te falta configurar Penny</h2>
      <p className="relative mt-2 max-w-md text-sm text-muted-foreground">
        Son tres pasos y un minuto. Sin tu presupuesto no puedo decirte cuánto te queda para gastar.
      </p>
      <Button className="relative mt-5" onClick={open}>
        Retomar
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.2} />
      </Button>
    </section>
  )
}
