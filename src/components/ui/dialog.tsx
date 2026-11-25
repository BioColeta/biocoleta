import { Dialog as DialogPrimitive } from 'radix-ui'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  side?: 'center' | 'left' | 'right'
  children: ReactNode
}

const positions = {
  center:
    'top-1/2 left-1/2 w-[min(32rem,calc(100vw-2rem))] max-h-[90dvh] -translate-x-1/2 -translate-y-1/2 rounded-xl',
  left: 'inset-y-0 left-0 w-72 max-w-[85vw]',
  right: 'inset-y-0 right-0 w-96 max-w-[92vw]',
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  side = 'center',
  children,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="animate-in fade-in fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content
          className={cn(
            'bg-card animate-in fade-in fixed z-50 flex flex-col gap-4 overflow-y-auto border p-5 shadow-2xl',
            positions[side],
          )}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="pr-8">
            <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="text-muted-foreground mt-1 text-sm">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          {children}
          <DialogPrimitive.Close
            className="hover:bg-muted absolute top-3 right-3 rounded-md p-1.5"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
