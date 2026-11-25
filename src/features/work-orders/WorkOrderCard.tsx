import { useDraggable } from '@dnd-kit/core'
import { Link } from '@tanstack/react-router'
import { CheckCircle2, GripVertical, MoreVertical } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Menu } from '@/components/ui/menu'
import type { WorkOrderStatus, WorkOrderView } from '@/domain/types'
import { nextStatuses } from '@/domain/workOrders'
import { priorityInfo, workOrderStatusLabel, workOrderTypeLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'

type Props = {
  order: WorkOrderView
  onMove: (to: WorkOrderStatus) => void
  onOpen: () => void
}

export function WorkOrderCard({ order, onMove, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useDraggable({ id: order.id })
  const next = nextStatuses(order.status)
  return (
    <article
      ref={setNodeRef}
      aria-label={`Ordem ${order.id}`}
      style={
        transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
      }
      className={cn(
        'bg-card grid gap-2 rounded-lg border p-3 text-sm',
        isDragging && 'relative z-20 shadow-2xl',
      )}
    >
      <div className="flex items-center gap-1">
        {next.length > 0 && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="text-muted-foreground cursor-grab touch-none rounded p-1"
            aria-label={`Arrastar ${order.id}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          className="mr-auto font-semibold underline-offset-4 hover:underline"
          onClick={onOpen}
        >
          {order.id}
        </button>
        {next.length > 0 && (
          <Menu
            trigger={
              <Button variant="ghost" size="icon" aria-label={`Mover ${order.id}`}>
                <MoreVertical />
              </Button>
            }
            items={next.map((status) => ({
              label: `Mover para ${workOrderStatusLabel[status]}`,
              onSelect: () => onMove(status),
            }))}
          />
        )}
      </div>
      <p>
        <Link
          to="/app/map"
          search={{ drain: order.drainId }}
          className="text-primary underline-offset-4 hover:underline"
        >
          {order.drainId}
        </Link>{' '}
        · {workOrderTypeLabel[order.type]}
      </p>
      <p className="text-muted-foreground">{order.crew}</p>
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge {...priorityInfo[order.priority]} />
        {order.alertStatus === 'cleared' && (
          <span className="text-ok flex items-center gap-1 text-xs">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Telemetria normalizada
          </span>
        )}
      </div>
    </article>
  )
}
