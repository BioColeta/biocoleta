import type { WorkOrder, WorkOrderStatus } from './types.ts'

const transitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  open: ['dispatched', 'cancelled'],
  dispatched: ['in_progress', 'cancelled'],
  in_progress: ['done', 'cancelled'],
  done: [],
  cancelled: [],
}

export function nextStatuses(from: WorkOrderStatus): WorkOrderStatus[] {
  return transitions[from]
}

export function canTransitionWorkOrder(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return transitions[from].includes(to)
}

export function isOpenWorkOrder(order: Pick<WorkOrder, 'status'>): boolean {
  return order.status !== 'done' && order.status !== 'cancelled'
}
