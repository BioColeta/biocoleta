import type { AlertView } from '@/domain/types'

export function AlertWorkOrderPanel({ alert }: { alert: AlertView }) {
  return <section aria-label={`Ordem de serviço de ${alert.id}`} />
}
