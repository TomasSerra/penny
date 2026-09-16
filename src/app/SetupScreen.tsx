import { Penny } from '@/components/brand/Penny'
import { AmbientBackground } from '@/components/layout/AmbientBackground'

const VARIABLES = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

export function SetupScreen() {
  return (
    <div className="grid min-h-(--app-height) place-items-center p-4">
      <AmbientBackground />
      <div className="paper-flat w-full max-w-lg rounded-4xl p-8">
        <Penny pose="sad" priority className="h-24" />
        <h1 className="mt-5 font-display text-3xl leading-tight">Falta configurar Firebase</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Copiá <code className="rounded bg-foreground/5 px-1">.env.example</code> a{' '}
          <code className="rounded bg-foreground/5 px-1">.env.local</code> y completá la configuración web de tu proyecto, o
          usá los emuladores con <code className="rounded bg-foreground/5 px-1">VITE_USE_EMULATORS=true</code>.
        </p>
        <ul className="mt-5 space-y-1.5 font-mono text-xs text-muted-foreground">
          {VARIABLES.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
