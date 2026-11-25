import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useMoveWorkOrder, useWorkOrders } from '@/api/hooks'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Page, PageHeader } from '@/components/page'
import { QueryView } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import type { WorkOrderStatus, WorkOrderView } from '@/domain/types'
import { formatDateTime } from '@/lib/format'
import { workOrderStatusLabel, workOrderTypeLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { requestMove } from './moves'
import { WorkOrderCard } from './WorkOrderCard'

const columns: WorkOrderStatus[] = ['open', 'dispatched', 'in_progress', 'done']
const DONE_SHOWN = 8

function Column({
  status,
  count,
  children,
}: {
  status: WorkOrderStatus
  count: number
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <section
      ref={setNodeRef}
      aria-label={workOrderStatusLabel[status]}
      className={cn(
        'bg-muted/40 flex min-h-40 min-w-0 flex-col gap-2 rounded-xl border p-2',
        isOver && 'border-primary',
      )}
    >
      <h2 className="px-1 text-sm font-semibold">
        {workOrderStatusLabel[status]} <span className="text-muted-foreground">({count})</span>
      </h2>
      {children}
    </section>
  )
}

function Details({ order }: { order: WorkOrderView }) {
  return (
    <div className="grid gap-3 text-sm">
      <p>
        {workOrderTypeLabel[order.type]} · {order.address}, {order.district}
      </p>
      {order.note && <p className="bg-background rounded-lg border p-3">{order.note}</p>}
      {order.alertId && (
        <Button asChild variant="outline" size="sm">
          <Link to="/app/alerts/$alertId" params={{ alertId: order.alertId }}>
            Abrir alerta {order.alertId}
          </Link>
        </Button>
      )}
      <h3 className="font-semibold">Histórico</h3>
      <ol className="grid gap-2">
        {order.history.map((entry) => (
          <li key={`${entry.status}-${entry.at}`}>
            <strong>{workOrderStatusLabel[entry.status]}</strong>
            <span className="text-muted-foreground block">
              {formatDateTime(entry.at)} · {entry.by}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Board({ orders }: { orders: WorkOrderView[] }) {
  const move = useMoveWorkOrder()
  const [openId, setOpenId] = useState<string | null>(null)
  const [pending, setPending] = useState<{
    id: string
    to: WorkOrderStatus
    title: string
    description: string
  } | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const apply = (id: string, status: WorkOrderStatus) =>
    move.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(`${id}: ${workOrderStatusLabel[status]}`),
        onError: (error) => toast.error(error.message),
      },
    )

  const attempt = (id: string, to: WorkOrderStatus) => {
    const order = orders.find((item) => item.id === id)
    if (!order) return
    const result = requestMove(order.status, to)
    if (result.kind === 'invalid') toast.error(result.reason)
    if (result.kind === 'move') apply(id, to)
    if (result.kind === 'confirm') setPending({ id, to, ...result })
  }

  const drop = ({ active, over }: DragEndEvent) => {
    if (over) attempt(String(active.id), over.id as WorkOrderStatus)
  }

  const byRecency = [...orders].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const cancelled = byRecency.filter((order) => order.status === 'cancelled')
  const opened = orders.find((order) => order.id === openId)

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={drop}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {columns.map((status) => {
            const own = byRecency.filter((order) => order.status === status)
            const shown = status === 'done' ? own.slice(0, DONE_SHOWN) : own
            return (
              <Column key={status} status={status} count={own.length}>
                {shown.map((order) => (
                  <WorkOrderCard
                    key={order.id}
                    order={order}
                    onMove={(to) => attempt(order.id, to)}
                    onOpen={() => setOpenId(order.id)}
                  />
                ))}
                {own.length === 0 && (
                  <p className="text-muted-foreground p-3 text-center text-sm">Nenhuma ordem</p>
                )}
              </Column>
            )
          })}
        </div>
      </DndContext>
      {cancelled.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer">Canceladas ({cancelled.length})</summary>
          <ul className="mt-2 flex flex-wrap gap-2">
            {cancelled.map((order) => (
              <li key={order.id}>
                <Button size="sm" variant="outline" onClick={() => setOpenId(order.id)}>
                  {order.id} · {order.drainId}
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <Dialog
        open={Boolean(opened)}
        onOpenChange={(open) => !open && setOpenId(null)}
        title={opened ? `${opened.id} · ${opened.drainId}` : ''}
        side="right"
      >
        {opened && <Details order={opened} />}
      </Dialog>
      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.title ?? ''}
        description={pending?.description ?? ''}
        confirmLabel="Confirmar"
        onConfirm={() => {
          if (pending) apply(pending.id, pending.to)
          setPending(null)
        }}
      />
    </>
  )
}

export function WorkOrdersPage() {
  const orders = useWorkOrders()
  return (
    <Page>
      <PageHeader
        title="Ordens de serviço"
        description="Arraste um cartão ou use o menu dele para avançar a etapa."
      />
      <QueryView query={orders}>{(data) => <Board orders={data} />}</QueryView>
    </Page>
  )
}
