const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/**
 * Aged cartoon-print backdrop: a sunburst radiating from the top, a halftone dot
 * screen over it and a faint paper grain. All three layers are static, so this
 * costs nothing to keep on screen.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -inset-x-1/4 -top-[10%] h-[140%]"
        style={{
          backgroundImage: 'repeating-conic-gradient(from 0deg at 50% 0%, var(--ray-color) 0deg 5deg, transparent 5deg 11deg)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(var(--halftone-color) 1px, transparent 1.3px)',
          backgroundSize: '9px 9px',
        }}
      />
      <div className="absolute inset-0 opacity-(--noise-opacity) mix-blend-multiply dark:mix-blend-screen" style={{ backgroundImage: NOISE }} />
    </div>
  )
}
