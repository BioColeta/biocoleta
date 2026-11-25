import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const control =
  'w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50 aria-invalid:border-danger'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-9', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-20 py-2', className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(control, 'h-9 pr-8', className)} {...props} />
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('grid gap-1.5 text-sm font-medium', className)} {...props} />
}
