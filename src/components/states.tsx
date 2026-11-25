import { Inbox, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-muted animate-pulse rounded-lg', className)} />
}

export function LoadingState({ label = 'Carregando' }: { label?: string }) {
  return (
    <div className="grid gap-3" role="status" aria-label={label}>
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  )
}

type EmptyProps = { title: string; description?: string; action?: ReactNode }

export function EmptyState({ title, description, action }: EmptyProps) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 p-8 text-center">
      <Inbox className="size-8" aria-hidden />
      <p className="text-foreground font-medium">{title}</p>
      {description && <p className="text-sm">{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 p-8 text-center">
      <TriangleAlert className="text-danger size-8" aria-hidden />
      <p className="text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

type QueryLike<T> = {
  data: T | undefined
  error: Error | null
  isPending: boolean
  refetch: () => unknown
}

export function QueryView<T>({
  query,
  children,
}: {
  query: QueryLike<T>
  children: (data: T) => ReactNode
}) {
  if (query.data !== undefined) return <>{children(query.data)}</>
  if (query.isPending) return <LoadingState />
  return (
    <ErrorState
      message={query.error?.message ?? 'Não foi possível carregar os dados.'}
      onRetry={() => query.refetch()}
    />
  )
}
