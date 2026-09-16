import { ApiIcon, ArrowRight01Icon, PlusSignIcon, Share08Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import type { ReactNode } from 'react'
import type { BudgetSummary } from '@shared/budget'
import { Money } from '@/components/common/Money'
import { usePwaInstall } from '@/hooks/usePwaInstall'

function Shortcut({
  icon,
  title,
  detail,
  onClick,
}: {
  icon: IconSvgElement
  title: string
  detail: ReactNode
  onClick?: () => void
}) {
  const content = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl border-2 border-ink-stamp bg-penny text-ink-stamp">
        <HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{detail}</span>
      </span>
      {onClick && <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />}
    </>
  )

  if (!onClick) {
    return <li className="flex items-center gap-3.5 rounded-3xl bg-foreground/[0.03] p-3.5 text-left dark:bg-white/[0.03]">{content}</li>
  }

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="press flex w-full items-center gap-3.5 rounded-3xl bg-foreground/[0.03] p-3.5 text-left outline-none hover:bg-foreground/[0.06] focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
      >
        {content}
      </button>
    </li>
  )
}

export function DoneStep({
  summary,
  onAddExpense,
  onOpenApi,
}: {
  summary: BudgetSummary
  onAddExpense: () => void
  onOpenApi: () => void
}) {
  const { standalone, isIOS, canInstall, install } = usePwaInstall()

  return (
    <div>
      <h1 className="font-display text-3xl leading-tight text-balance">¡Listo, ya estás en marcha!</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Este mes podés gastar hasta{' '}
        <Money value={summary.variableARS} className="font-semibold text-foreground" /> sin tocar tu ahorro. Cargá tus
        gastos y yo te aviso cómo vas.
      </p>

      <ul className="mt-6 flex flex-col gap-2.5">
        <Shortcut
          icon={PlusSignIcon}
          title="Cargá tu primer gasto"
          detail="Monto, categoría y listo, en dos toques."
          onClick={onAddExpense}
        />
        {!standalone && (
          <Shortcut
            icon={Share08Icon}
            title="Instalá Penny en tu teléfono"
            detail={
              canInstall
                ? 'Para tenerla como una app más, a mano.'
                : isIOS
                  ? 'En Safari: Compartir → Agregar a inicio.'
                  : 'Desde el menú del navegador: “Instalar aplicación”.'
            }
            onClick={canInstall ? () => void install() : undefined}
          />
        )}
        <Shortcut
          icon={ApiIcon}
          title="Cargá gastos desde un Atajo de iOS"
          detail="Generá tu API key en Ajustes y anotá un gasto sin abrir la app."
          onClick={onOpenApi}
        />
      </ul>
    </div>
  )
}
