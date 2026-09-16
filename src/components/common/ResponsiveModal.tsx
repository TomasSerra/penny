import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/** Centered dialog on desktop, bottom sheet on mobile. */
export function ResponsiveModal({ open, onOpenChange, title, description, children, footer, className }: ResponsiveModalProps) {
  const desktop = useIsDesktop()

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn('flex flex-col overflow-hidden sm:max-w-lg', className)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className={cn(!description && 'sr-only')}>{description ?? title}</DialogDescription>
          </DialogHeader>
          {/* Only the body scrolls, so the scrollbar sits inside the padding instead of on the card's rounded edge. */}
          <div className="-my-1 -mr-4 -ml-1 min-h-0 flex-1 overflow-y-auto py-1 pr-4 pl-1">{children}</div>
          {footer && <DialogFooter>{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent className={className}>
        <DrawerHeader className="px-5 pt-4 pb-2 text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className={cn(!description && 'sr-only')}>{description ?? title}</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">{children}</div>
        {footer && <DrawerFooter className="px-5 pt-2 pb-4">{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  )
}
