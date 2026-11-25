import type { Alert } from '@/domain/types'

type Step = { title: string; at: string; detail?: string }

export function timelineOf(alert: Alert): Step[] {
  const steps: Step[] = [{ title: 'Alerta criado', at: alert.createdAt }]
  if (alert.decidedAt) {
    const dismissed = alert.status === 'false_positive'
    steps.push({
      title: dismissed ? 'Marcado como falso positivo' : 'Obstrução confirmada',
      at: alert.decidedAt,
      detail: [alert.decidedBy, alert.decisionNote].filter(Boolean).join(' · '),
    })
  }
  if (alert.clearedAt) steps.push({ title: 'Telemetria normalizada', at: alert.clearedAt })
  return steps
}
