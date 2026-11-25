import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useCreateWorkOrder, useWorkOrders } from '@/api/hooks'
import { QueryView } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import type { AlertView } from '@/domain/types'
import { priorityInfo, workOrderStatusLabel } from '@/lib/labels'
import { WorkOrderForm } from './WorkOrderForm'

export function AlertWorkOrderPanel({ alert }: { alert: AlertView }) {
  const orders = useWorkOrders()
  const create = useCreateWorkOrder()
  return (
    <Card aria-label="Ordem de serviço">
      <CardTitle>Ordem de serviço</CardTitle>
      <QueryView query={orders}>
        {(data) => {
          const order = data.find(
            (item) => item.alertId === alert.id && item.status !== 'cancelled',
          )
          if (order) {
            return (
              <div className="grid gap-2 text-sm">
                <p>
                  <strong>{order.id}</strong> · {workOrderStatusLabel[order.status]} · {order.crew}
                </p>
                <div>
                  <StatusBadge {...priorityInfo[order.priority]} />
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/app/work-orders">Abrir quadro</Link>
                </Button>
              </div>
            )
          }
          if (alert.status !== 'confirmed') {
            return (
              <p className="text-muted-foreground text-sm">
                {alert.status === 'new'
                  ? 'Confirme a obstrução para criar uma ordem de serviço.'
                  : 'Este alerta foi encerrado sem ordem de serviço.'}
              </p>
            )
          }
          return (
            <WorkOrderForm
              submitLabel="Criar ordem de serviço"
              pending={create.isPending}
              onSubmit={(values) =>
                create.mutate(
                  { ...values, type: 'corrective', alertId: alert.id },
                  {
                    onSuccess: (created) => toast.success(`${created.id} criada`),
                    onError: (error) => toast.error(error.message),
                  },
                )
              }
            />
          )
        }}
      </QueryView>
    </Card>
  )
}
