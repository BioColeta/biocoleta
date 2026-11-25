import type { WorkOrderStatus } from '@/domain/types'
import { canTransitionWorkOrder } from '@/domain/workOrders'
import { workOrderStatusLabel } from '@/lib/labels'

export type MoveRequest =
  | { kind: 'ignore' }
  | { kind: 'invalid'; reason: string }
  | { kind: 'confirm'; title: string; description: string }
  | { kind: 'move' }

export function requestMove(from: WorkOrderStatus, to: WorkOrderStatus): MoveRequest {
  if (from === to) return { kind: 'ignore' }
  if (!canTransitionWorkOrder(from, to)) {
    return {
      kind: 'invalid',
      reason: `Uma ordem "${workOrderStatusLabel[from]}" não pode ir para "${workOrderStatusLabel[to]}".`,
    }
  }
  if (to === 'dispatched') {
    return {
      kind: 'confirm',
      title: 'Despachar equipe',
      description: 'A equipe será enviada ao local. Confirme o despacho.',
    }
  }
  if (to === 'cancelled') {
    return {
      kind: 'confirm',
      title: 'Cancelar ordem',
      description: 'A ordem cancelada não pode ser reaberta.',
    }
  }
  return { kind: 'move' }
}
