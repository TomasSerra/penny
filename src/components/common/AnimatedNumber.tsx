import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect } from 'react'

interface AnimatedNumberProps {
  value: number
  format: (value: number) => string
  className?: string
  /** Count up from zero on first render */
  fromZero?: boolean
}

export function AnimatedNumber({ value, format, className, fromZero = true }: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion()
  const motionValue = useMotionValue(fromZero && !reducedMotion ? 0 : value)
  const text = useTransform(motionValue, (latest) => format(latest))

  useEffect(() => {
    if (reducedMotion) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [value, reducedMotion, motionValue])

  return <motion.span className={className}>{text}</motion.span>
}
