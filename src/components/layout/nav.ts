import { Home01Icon, Invoice03Icon, PieChartIcon, Settings02Icon } from '@hugeicons/core-free-icons'

export const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: Home01Icon },
  { to: '/gastos', label: 'Gastos', icon: Invoice03Icon },
  { to: '/presupuesto', label: 'Presupuesto', icon: PieChartIcon },
  { to: '/ajustes', label: 'Ajustes', icon: Settings02Icon },
] as const

export const NAV_SPRING = { type: 'spring', bounce: 0.2, duration: 0.5 } as const
