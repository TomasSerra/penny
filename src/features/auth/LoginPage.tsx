import { GoogleIcon, Loading03Icon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, type Location } from 'react-router'
import { authErrorMessage, signInWithEmail, signInWithGoogle, signUpWithEmail, useAuth } from '@/app/auth'
import { SplashScreen } from '@/app/SplashScreen'
import { Penny } from '@/components/brand/Penny'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { AmbientBackground } from '@/components/layout/AmbientBackground'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'login' | 'register'

const EASE = [0.16, 1, 0.3, 1] as const

export function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState<'google' | 'email' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: Location } | null)?.from
  const destination = from ? `${from.pathname}${from.search}` : '/'

  if (loading) return <SplashScreen />
  if (user) return <Navigate to={destination} replace />

  async function run(kind: 'google' | 'email', action: () => Promise<unknown>) {
    setPending(kind)
    setError(null)
    try {
      await action()
      navigate(destination, { replace: true })
    } catch (caught) {
      setError(authErrorMessage(caught))
    } finally {
      setPending(null)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void run('email', () =>
      mode === 'login' ? signInWithEmail(email.trim(), password) : signUpWithEmail(name.trim(), email.trim(), password),
    )
  }

  return (
    <div className="relative grid min-h-(--app-height) place-items-center px-4 py-10">
      <AmbientBackground />

      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <motion.div animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            <Penny pose="base" priority className="h-36" />
          </motion.div>
          <h1 className="mt-4 font-display text-6xl leading-none">Penny</h1>
          <p className="mt-2 text-muted-foreground">
            Tu plata, <span className="font-semibold text-penny-ink">clara</span> y en orden.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
          className="paper-flat rounded-4xl p-5 sm:p-6"
        >
          <SegmentedControl<Mode>
            stretch
            value={mode}
            onChange={(next) => {
              setMode(next)
              setError(null)
            }}
            options={[
              { value: 'login', label: 'Ingresar' },
              { value: 'register', label: 'Crear cuenta' },
            ]}
          />

          <Button
            variant="outline"
            size="lg"
            className="mt-5 w-full"
            disabled={pending !== null}
            onClick={() => void run('google', signInWithGoogle)}
          >
            <HugeiconsIcon icon={pending === 'google' ? Loading03Icon : GoogleIcon} className={pending === 'google' ? 'animate-spin' : ''} />
            Continuar con Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />o con tu email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="name"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="-m-1 overflow-hidden p-1"
                >
                  <Label htmlFor="name" className="mb-1.5 block">
                    Nombre
                  </Label>
                  <Input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="¿Cómo te llamás?" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email" className="mb-1.5 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vos@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="mb-1.5 block">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} className="size-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending !== null}>
              {pending === 'email' && <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />}
              {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
