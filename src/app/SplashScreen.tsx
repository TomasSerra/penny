import { motion } from 'motion/react'
import { Penny } from '@/components/brand/Penny'

/** Penny bobbing while the session, the profile or the first month's data load. */
export function SplashScreen() {
  return (
    <div className="grid min-h-(--app-height) place-items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, -10, 0] }}
        transition={{ opacity: { duration: 0.4 }, y: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <Penny pose="base" priority className="h-24" />
      </motion.div>
    </div>
  )
}
