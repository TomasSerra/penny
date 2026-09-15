import {
  ApiIcon,
  ComputerIcon,
  CreditCardIcon,
  DollarCircleIcon,
  Key01Icon,
  Loading03Icon,
  Moon02Icon,
  PaintBoardIcon,
  Refresh01Icon,
  Share08Icon,
  Sun01Icon,
  Tick02Icon,
  UserCircleIcon,
  ViewIcon,
  ViewOffIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { motion } from 'motion/react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { toast } from 'sonner'
import { RATE_SIDES, RATE_TYPES } from '@shared/rates'
import type { RateSide, ThemePreference } from '@shared/types'
import { signOut } from '@/app/auth'
import { useSession } from '@/app/session'
import { useTheme } from '@/app/theme'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CopyButton } from '@/components/common/CopyButton'
import { PageHeader } from '@/components/common/PageHeader'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { rotateApiKey, updateSettings, useApiKey } from '@/data/profile'
import { useQuotes } from '@/data/rates'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { formatMoney, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

function Section({
  id,
  icon,
  title,
  description,
  action,
  children,
  index,
}: {
  id?: string
  icon: IconSvgElement
  title: string
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  index: number
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="glass scroll-mt-6 rounded-4xl p-5 md:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-penny/15 text-penny-ink">
          <HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  )
}

function AppearanceSection() {
  const { uid } = useSession()
  const { preference, setPreference } = useTheme()
  return (
    <Section index={0} icon={PaintBoardIcon} title="Apariencia" description="Elegí cómo se ve Penny en este dispositivo.">
      <SegmentedControl<ThemePreference>
        value={preference}
        onChange={(value, event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setPreference(value, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
          updateSettings(uid, { theme: value }).catch(() => {})
        }}
        options={[
          { value: 'light', label: 'Claro', icon: Sun01Icon },
          { value: 'dark', label: 'Oscuro', icon: Moon02Icon },
          { value: 'system', label: 'Automático', icon: ComputerIcon },
        ]}
      />
    </Section>
  )
}

function RateSection() {
  const { uid, settings } = useSession()
  const { data: quotes, isFetching, refetch, dataUpdatedAt, isError } = useQuotes()
  const layoutId = useId()
  const side = settings.rate.side
  const otherSide: RateSide = side === 'compra' ? 'venta' : 'compra'

  const save = (rate: typeof settings.rate) =>
    updateSettings(uid, { rate }).catch((error: Error) => toast.error('No se pudo guardar', { description: error.message }))

  return (
    <Section
      index={1}
      id="dolar"
      icon={DollarCircleIcon}
      title="Tipo de cambio"
      description="Se usa para convertir ingresos, gastos y resultados entre pesos y dólares."
      action={
        <SegmentedControl<RateSide>
          size="sm"
          value={side}
          onChange={(next) => save({ ...settings.rate, side: next })}
          options={RATE_SIDES.map((item) => ({ value: item.id, label: item.label }))}
        />
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {RATE_TYPES.map((type) => {
          const quote = quotes?.find((item) => item.casa === type.id)
          const selected = settings.rate.type === type.id
          const value = quote?.[side]
          const other = quote?.[otherSide]
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => save({ ...settings.rate, type: type.id })}
              aria-pressed={selected}
              className={cn(
                'relative rounded-2xl bg-foreground/[0.03] p-3.5 text-left transition-colors outline-none hover:bg-foreground/[0.05] focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-white/[0.03]',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={layoutId}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                  className="absolute inset-0 rounded-2xl bg-penny/12 ring-[1.5px] ring-penny/80 ring-inset"
                />
              )}
              <span className="relative flex items-center justify-between text-xs font-medium text-muted-foreground">
                {type.label}
                {selected && <HugeiconsIcon icon={Tick02Icon} className="size-4 text-penny-ink" strokeWidth={2.2} />}
              </span>
              <span className="relative mt-1 block text-lg font-semibold">
                {value ? formatMoney(value, 'ARS', { cents: !Number.isInteger(value) }) : '—'}
              </span>
              <span className="relative block text-[11px] text-muted-foreground">
                {other ? `${otherSide === 'compra' ? 'Compra' : 'Venta'} ${formatMoney(other, 'ARS', { cents: !Number.isInteger(other) })}` : ' '}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {isError ? 'No se pudo actualizar la cotización' : 'Fuente: dolarapi.com'}
          {dataUpdatedAt > 0 && ` · actualizado ${formatTime(new Date(dataUpdatedAt))}`}
        </span>
        <Button variant="ghost" size="sm" onClick={() => void refetch()} disabled={isFetching}>
          <HugeiconsIcon icon={isFetching ? Loading03Icon : Refresh01Icon} className={isFetching ? 'animate-spin' : ''} />
          Actualizar
        </Button>
      </div>
    </Section>
  )
}

function CardSection() {
  const { uid, settings } = useSession()
  const day = settings.cardClosingDay
  return (
    <Section
      index={2}
      icon={CreditCardIcon}
      title="Tarjeta de crédito"
      description={`Las compras en cuotas hechas después del día ${day} empiezan a pagarse en el resumen del mes siguiente.`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm">Día de cierre del resumen</span>
        <Select value={String(day)} onValueChange={(value) => updateSettings(uid, { cardClosingDay: Number(value) }).catch(() => toast.error('No se pudo guardar'))}>
          <SelectTrigger className="h-11 w-32 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72 rounded-2xl">
            {Array.from({ length: 31 }, (_, index) => index + 1).map((option) => (
              <SelectItem key={option} value={String(option)}>
                Día {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Section>
  )
}

const API_FIELDS = [
  { field: 'amount', example: '13600', note: 'Obligatorio. Acepta "$13.600" o "1.234,56".' },
  { field: 'category', example: '🍔 Comida', note: 'Obligatorio. Con o sin emoji.' },
  { field: 'paymentMethod', example: '📱 Billetera virtual', note: 'Obligatorio. Crédito, débito, billetera o efectivo.' },
  { field: 'description', example: 'Milanesa Sirius', note: 'Opcional.' },
  { field: 'necessary', example: 'Si', note: 'Opcional, Si/No. Por defecto Si.' },
  { field: 'date', example: '15/09/2026', note: 'Opcional. Si no va, se usa ahora.' },
  { field: 'currency', example: 'ARS', note: 'Opcional, ARS o USD.' },
  { field: 'installments', example: '6', note: 'Opcional, solo con tarjeta de crédito.' },
]

const EXAMPLE_BODY = `{
  "date": "15/09/2026",
  "amount": 13600,
  "description": "Milanesa Sirius",
  "category": "🍔 Comida",
  "paymentMethod": "📱 Billetera virtual",
  "necessary": "Si"
}`

function ApiSection() {
  const { user, uid } = useSession()
  const { data: apiKey, loading } = useApiKey(uid)
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)

  const endpoint = `${window.location.origin}/api/expenses`
  const url = apiKey ? `${endpoint}?key=${apiKey}` : ''
  const shownUrl = apiKey && !visible ? `${endpoint}?key=${apiKey.slice(0, 8)}${'•'.repeat(18)}` : url

  async function generate() {
    setBusy(true)
    setConfirmRotate(false)
    try {
      await rotateApiKey(user)
      toast.success(apiKey ? 'Generaste una API key nueva' : 'API key lista', {
        description: apiKey ? 'Actualizá la URL en tu Atajo.' : undefined,
      })
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section
      index={3}
      id="api"
      icon={ApiIcon}
      title="API para tu Atajo"
      description="Cargá gastos desde un Atajo de iOS (o cualquier app) con un POST a esta URL."
    >
      {loading ? (
        <div className="h-11 animate-pulse rounded-full bg-foreground/5" />
      ) : !apiKey ? (
        <div className="flex flex-col items-start gap-3 rounded-3xl bg-foreground/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-white/[0.03]">
          <p className="text-sm text-muted-foreground">Generá tu API key personal para empezar.</p>
          <Button onClick={generate} disabled={busy}>
            <HugeiconsIcon icon={busy ? Loading03Icon : Key01Icon} className={busy ? 'animate-spin' : ''} />
            Generar API key
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-11 min-w-0 flex-1 items-center rounded-full bg-foreground/[0.04] px-4 font-mono text-[12.5px] dark:bg-white/[0.05]">
                <span className="shrink-0 rounded-md bg-penny/20 px-1.5 py-0.5 text-[10.5px] font-semibold text-penny-ink">POST</span>
                <span className="ml-2.5 truncate">{shownUrl}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 rounded-full"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? 'Ocultar key' : 'Mostrar key'}
              >
                <HugeiconsIcon icon={visible ? ViewOffIcon : ViewIcon} />
              </Button>
              <CopyButton value={url} label="Copiar URL" />
            </div>
            <p className="mt-2 px-1 text-xs text-muted-foreground">
              La key es secreta: quien la tenga puede cargar gastos en tu cuenta. Header <code>Content-Type: application/json</code>.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl ring-1 ring-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/[0.03] text-xs text-muted-foreground dark:bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Campo</th>
                  <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Ejemplo</th>
                  <th className="px-4 py-2.5 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {API_FIELDS.map((row) => (
                  <tr key={row.field}>
                    <td className="px-4 py-2.5 font-mono text-[12.5px]">{row.field}</td>
                    <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">{row.example}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="relative">
            <pre className="overflow-x-auto rounded-3xl bg-foreground/[0.04] p-4 font-mono text-[12.5px] leading-relaxed dark:bg-black/25">{EXAMPLE_BODY}</pre>
            <CopyButton value={EXAMPLE_BODY} label="Copiar ejemplo" className="absolute top-3 right-3 size-9" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Para armar menús en el Atajo, <code className="font-mono">GET /api/meta</code> devuelve las categorías y medios de pago.
            </p>
            <Button variant="outline" onClick={() => setConfirmRotate(true)} disabled={busy} className="shrink-0">
              <HugeiconsIcon icon={busy ? Loading03Icon : Refresh01Icon} className={busy ? 'animate-spin' : ''} />
              Generar key nueva
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmRotate}
        onOpenChange={setConfirmRotate}
        title="¿Generar una key nueva?"
        description="La key actual deja de funcionar al instante. Vas a tener que actualizar la URL en tu Atajo."
        confirmLabel="Generar nueva"
        onConfirm={() => void generate()}
      />
    </Section>
  )
}

function InstallSection() {
  const { standalone, isIOS, canInstall, install } = usePwaInstall()
  return (
    <Section index={4} icon={Share08Icon} title="Instalar la app" description="Usá Penny como una app más, con acceso directo y pantalla completa.">
      {standalone ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={Tick02Icon} className="size-4 text-success" strokeWidth={2.2} />
          Ya estás usando la app instalada.
        </p>
      ) : canInstall ? (
        <Button onClick={() => void install()}>Instalar Penny</Button>
      ) : isIOS ? (
        <p className="text-sm text-muted-foreground">
          En Safari tocá <span className="font-medium text-foreground">Compartir</span> y después{' '}
          <span className="font-medium text-foreground">Agregar a inicio</span>.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Desde el menú de tu navegador elegí “Instalar aplicación” o “Agregar a pantalla de inicio”.</p>
      )}
    </Section>
  )
}

const PROVIDERS: Record<string, string> = { 'google.com': 'Google', password: 'Email y contraseña' }

function AccountSection() {
  const { user } = useSession()
  const providers = user.providerData.map((provider) => PROVIDERS[provider.providerId] ?? provider.providerId).join(' · ')
  return (
    <Section index={5} icon={UserCircleIcon} title="Cuenta" description={user.email ?? undefined}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">Ingresás con {providers || 'email'}</span>
        <Button variant="outline" onClick={() => void signOut()}>
          Cerrar sesión
        </Button>
      </div>
    </Section>
  )
}

export default function SettingsPage() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const timeout = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    return () => clearTimeout(timeout)
  }, [hash])

  return (
    <>
      <PageHeader title="Ajustes" eyebrow="Personalizá Penny a tu manera" />
      <div className="flex max-w-3xl flex-col gap-4">
        <AppearanceSection />
        <RateSection />
        <CardSection />
        <ApiSection />
        <InstallSection />
        <AccountSection />
      </div>
    </>
  )
}
