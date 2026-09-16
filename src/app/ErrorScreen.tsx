import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Penny } from '@/components/brand/Penny'
import { AmbientBackground } from '@/components/layout/AmbientBackground'
import { Button } from '@/components/ui/button'

/** Route-level catch-all, so a render error shows Penny instead of a blank page. */
export function ErrorScreen() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="grid min-h-(--app-height) place-items-center p-4">
      <AmbientBackground />
      <div className="paper-flat flex w-full max-w-md flex-col items-center rounded-4xl p-8 text-center">
        <Penny pose="sad" priority className="h-36 -rotate-2" />
        <h1 className="mt-4 font-display text-3xl leading-tight">
          {notFound ? 'Esta página no existe' : 'Se nos cayó una moneda'}
        </h1>
        <p className="mt-2.5 text-sm text-balance text-muted-foreground">
          {notFound
            ? 'El link que seguiste no lleva a ningún lado. Volvé al inicio y seguimos.'
            : 'Algo falló de este lado. Probá de nuevo y, si sigue pasando, recargá la página.'}
        </p>
        <Button asChild className="mt-6">
          <a href="/">Volver al inicio</a>
        </Button>
      </div>
    </div>
  )
}
