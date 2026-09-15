const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/**
 * Slow-drifting warm light behind the glass surfaces, plus a faint grain so
 * gradients don't band. Only transforms animate, so it stays cheap.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-[25%] -left-[15%] size-[75vmax] rounded-full [background:radial-gradient(closest-side,var(--ambient-1),transparent)] will-change-transform animate-[ambient-drift_38s_ease-in-out_infinite]" />
      <div className="absolute top-[25%] -right-[25%] size-[65vmax] rounded-full [background:radial-gradient(closest-side,var(--ambient-2),transparent)] will-change-transform animate-[ambient-drift_54s_ease-in-out_infinite_reverse]" />
      <div className="absolute -bottom-[35%] left-[15%] size-[60vmax] rounded-full [background:radial-gradient(closest-side,var(--ambient-3),transparent)] will-change-transform animate-[ambient-drift_72s_ease-in-out_infinite]" />
      <div className="absolute inset-0 opacity-(--noise-opacity) mix-blend-overlay" style={{ backgroundImage: NOISE }} />
    </div>
  )
}
