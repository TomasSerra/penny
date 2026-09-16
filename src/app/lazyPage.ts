import { type ComponentType, lazy } from 'react'

const RELOAD_KEY = 'penny:stale-build-reload'
// A second failure this soon after reloading is a real outage (e.g. offline), not a stale build.
const RELOAD_COOLDOWN_MS = 10_000

let reloading = false

/**
 * After a deploy (or the service worker swapping in a new build) an open tab still asks for
 * the old hashed chunks, which no longer exist. Reload once to pick up the new build.
 */
function reloadForNewBuild() {
  if (reloading) return true
  const lastReload = Number(sessionStorage.getItem(RELOAD_KEY))
  if (Date.now() - lastReload < RELOAD_COOLDOWN_MS) return false
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  reloading = true
  window.location.reload()
  return true
}

export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().catch((error: unknown) => {
      // Never settle while the page reloads, so the error screen doesn't flash.
      if (reloadForNewBuild()) return new Promise<never>(() => {})
      throw error
    }),
  )
}
