import type { Tone } from '@/components/status-badge'
import type {
  AlertStatus,
  Classification,
  DrainStatus,
  Priority,
  Scenario,
  WorkOrderStatus,
  WorkOrderType,
} from '@/domain/types'

type Descriptor = { label: string; tone: Tone }

export const drainStatusInfo: Record<DrainStatus, Descriptor> = {
  obstructed: { label: 'Obstruído', tone: 'danger' },
  attention: { label: 'Atenção', tone: 'warning' },
  offline: { label: 'Offline', tone: 'neutral' },
  normal: { label: 'Normal', tone: 'ok' },
}

export const alertStatusInfo: Record<AlertStatus, Descriptor> = {
  new: { label: 'Aguardando decisão', tone: 'danger' },
  confirmed: { label: 'Confirmado', tone: 'warning' },
  false_positive: { label: 'Falso positivo', tone: 'neutral' },
  cleared: { label: 'Normalizado', tone: 'ok' },
}

export const workOrderStatusLabel: Record<WorkOrderStatus, string> = {
  open: 'Aberta',
  dispatched: 'Despachada',
  in_progress: 'Em execução',
  done: 'Concluída',
  cancelled: 'Cancelada',
}

export const workOrderTypeLabel: Record<WorkOrderType, string> = {
  corrective: 'Corretiva',
  preventive: 'Preventiva',
}

export const priorityInfo: Record<Priority, Descriptor> = {
  low: { label: 'Prioridade baixa', tone: 'neutral' },
  medium: { label: 'Prioridade média', tone: 'warning' },
  high: { label: 'Prioridade alta', tone: 'danger' },
}

export const scenarioLabel: Record<Scenario, string> = {
  normal: 'Normal',
  heavy_rain: 'Chuva forte',
  obstruction: 'Obstrução',
  flash_flood: 'Enxurrada',
  sensor_offline: 'Sensor offline',
  tamper: 'Violação da tampa',
  manual: 'Manual',
}

export const classificationLabel: Record<Classification, string> = {
  obstruction: 'Provável obstrução',
  sensor_fault: 'Possível falha de sensor',
  normal: 'Escoamento normal',
  inconclusive: 'Inconclusivo',
}

export const actorLabel = { system: 'Sistema', operator: 'Operador', device: 'Dispositivo' }

export const auditTypeLabel: Record<string, string> = {
  'alert.created': 'Alerta criado',
  'alert.confirmed': 'Obstrução confirmada',
  'alert.false_positive': 'Marcado como falso positivo',
  'alert.cleared': 'Alerta encerrado pela telemetria',
  'analysis.completed': 'Análise concluída',
  'work_order.created': 'Ordem de serviço criada',
  'work_order.status_changed': 'Ordem de serviço atualizada',
  'device.tamper_detected': 'Violação detectada',
  'prompt.activated': 'Versão de prompt ativada',
  'simulation.preset': 'Cenário global aplicado',
}
