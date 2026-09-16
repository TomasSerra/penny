import { cn } from '@/lib/utils'
import angry from '@/assets/penny/angry.webp'
import base from '@/assets/penny/base.webp'
import baseSmall from '@/assets/penny/base-sm.webp'
import celebration from '@/assets/penny/celebration.webp'
import rock from '@/assets/penny/rock.webp'
import sad from '@/assets/penny/sad.webp'
import sunglasses from '@/assets/penny/sunglasses.webp'
import surprise from '@/assets/penny/surprise.webp'
import thumbUp from '@/assets/penny/thumb-up.webp'

/** The mascot's moods. `baseSmall` is the same pose at icon resolution, for the logo mark. */
const POSES = { base, baseSmall, celebration, rock, sad, angry, surprise, sunglasses, thumbUp } as const

export type PennyPose = keyof typeof POSES

interface PennyProps {
  pose?: PennyPose
  /** Leave empty for decorative use — the image is then hidden from screen readers. */
  alt?: string
  /** Skip lazy loading for above-the-fold marks (logo, splash). */
  priority?: boolean
  className?: string
}

/** The Penny mascot. Size it by height (`h-*`); the width follows the 546x720 artwork. */
export function Penny({ pose = 'base', alt = '', priority, className }: PennyProps) {
  return (
    <img
      src={POSES[pose]}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      className={cn('w-auto select-none', className)}
    />
  )
}
