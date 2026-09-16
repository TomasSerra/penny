import {
  Airplane01Icon,
  BulbIcon,
  Bus01Icon,
  Car01Icon,
  FirstAidKitIcon,
  GiftIcon,
  GraduationCapIcon,
  Hamburger02Icon,
  Home01Icon,
  Package02Icon,
  PawPrintIcon,
  PopcornIcon,
  ShampooIcon,
  ShoppingBasket01Icon,
  TShirtIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import type { CategoryId } from '@shared/types'

/**
 * The drawn half of a category: a line icon on its own tint.
 * The catalog keeps the emoji because the Shortcut API still matches text against it,
 * but nothing in the interface renders it any more.
 *
 * Tints are fixed in both themes — like the gold coin — so the ink-stamp glyph on top
 * always reads. They live in `index.css` as `--cat-*`.
 */
export interface CategoryStyle {
  icon: IconSvgElement
  color: string
}

export const CATEGORY_STYLE: Record<CategoryId, CategoryStyle> = {
  food: { icon: Hamburger02Icon, color: 'var(--cat-food)' },
  groceries: { icon: ShoppingBasket01Icon, color: 'var(--cat-groceries)' },
  car: { icon: Car01Icon, color: 'var(--cat-car)' },
  transport: { icon: Bus01Icon, color: 'var(--cat-transport)' },
  personal_care: { icon: ShampooIcon, color: 'var(--cat-personal-care)' },
  health: { icon: FirstAidKitIcon, color: 'var(--cat-health)' },
  home: { icon: Home01Icon, color: 'var(--cat-home)' },
  utilities: { icon: BulbIcon, color: 'var(--cat-utilities)' },
  entertainment: { icon: PopcornIcon, color: 'var(--cat-entertainment)' },
  clothing: { icon: TShirtIcon, color: 'var(--cat-clothing)' },
  education: { icon: GraduationCapIcon, color: 'var(--cat-education)' },
  travel: { icon: Airplane01Icon, color: 'var(--cat-travel)' },
  gifts: { icon: GiftIcon, color: 'var(--cat-gifts)' },
  pets: { icon: PawPrintIcon, color: 'var(--cat-pets)' },
  other: { icon: Package02Icon, color: 'var(--cat-other)' },
}

const FALLBACK: CategoryStyle = CATEGORY_STYLE.other

export function categoryStyle(id: CategoryId | string): CategoryStyle {
  return CATEGORY_STYLE[id as CategoryId] ?? FALLBACK
}
