import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.svg"
      alt=""
      draggable={false}
      className={cn('size-8 drop-shadow-[0_6px_14px_oklch(0.7_0.16_60/0.45)] select-none', className)}
    />
  )
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      <span className="font-display text-2xl leading-none">Penny</span>
    </span>
  )
}
