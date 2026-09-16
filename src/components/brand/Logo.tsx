import { cn } from '@/lib/utils'
import { Penny } from './Penny'
import type { PennyPose } from './Penny'

export function LogoMark({ className, pose = 'baseSmall' }: { className?: string; pose?: PennyPose }) {
  return <Penny pose={pose} priority className={cn('h-9', className)} />
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark className={markClassName} />
      <span className="font-display text-2xl leading-none">Penny</span>
    </span>
  )
}
