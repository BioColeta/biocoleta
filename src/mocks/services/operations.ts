import { analyzeReadings } from '@/domain/analysis'
import { canTransitionAlert, isOpenAlert } from '@/domain/rules'
import { analysisSchema, type DecisionOutcome, type Priority, type User } from '@/domain/types'
import type { WorkOrderStatus, WorkOrderType } from '@/domain/types'
import { canTransitionWorkOrder, isOpenWorkOrder } from '@/domain/workOrders'
import type { Db } from '@/mocks/db'
import { conflict, findDrain, nextCode, notFound, record, ServiceError } from './common'
import { alertView, workOrderView } from './queries'
import { minutesBetween } from '@/domain/metrics'

const ANALYSIS_WINDOW = 10

function findAlert(db: Db, id: string) {
  const alert = db.alerts.find((item) => item.id === id)
  if (!alert) throw notFound('Alerta')
  return alert
}

type Decision = { outcome: DecisionOutcome; note?: string }

export function decide(db: Db, id: string, decision: Decision, user: User, now: Date) {
  const alert = findAlert(db, id)
  if (!canTransitionAlert(alert.status, decision.outcome)) {
    throw conflict('alert_changed', 'Este alerta já não aguarda decisão')
  }
  alert.status = decision.outcome
  alert.decidedAt = now.toISOString()
  alert.decidedBy = user.name
  alert.decisionNote = decision.note?.trim() || null
  if (decision.outcome === 'false_positive') {
    findDrain(db, alert.drainId).detectionArmed = false
  }
  record(
    db,
    {
      type: `alert.${decision.outcome}`,
      actor: 'operator',
      entityType: 'alert',
      entityId: alert.id,
      details: {
        drainId: alert.drainId,
        by: user.name,
        minutesToDecision: Math.round(minutesBetween(alert.createdAt, alert.decidedAt)),
      },
    },
    now,
  )
  return alertView(db, id)
}

export function analyze(db: Db, alertId: string, now: Date) {
  const alert = findAlert(db, alertId)
  const { aiMode } = db.simulation
  if (aiMode === 'unavailable') {
    throw new ServiceError(503, 'analysis_unavailable', 'Serviço de análise indisponível')
  }
  const prompt = db.prompts.find((item) => item.active)!
  const until = isOpenAlert(alert.status) ? now.toISOString() : alert.createdAt
  const recent = (db.telemetry[alert.deviceId] ?? [])
    .filter((reading) => reading.recordedAt <= until)
    .slice(-ANALYSIS_WINDOW)
  const readings = recent.length ? recent : alert.evidence.readings
  const output = {
    ...analyzeReadings(readings, prompt.version),
    ...(aiMode === 'invalid' ? { probability: 7 } : {}),
    id: `AI-${String(db.counters.analysis + 1).padStart(4, '0')}`,
    alertId,
    promptVersion: prompt.version,
    createdAt: now.toISOString(),
  }
  const parsed = analysisSchema.safeParse(output)
  if (!parsed.success) {
    throw new ServiceError(502, 'invalid_analysis', 'A análise retornou uma resposta inválida')
  }
  db.counters.analysis += 1
  db.analyses.push(parsed.data)
  record(
    db,
    {
      type: 'analysis.completed',
      actor: 'system',
      entityType: 'alert',
      entityId: alertId,
      details: {
        drainId: alert.drainId,
        promptVersion: prompt.version,
        classification: parsed.data.classification,
      },
    },
    now,
  )
  return parsed.data
}

export function activatePrompt(db: Db, version: string, user: User, now: Date) {
  if (!db.prompts.some((prompt) => prompt.version === version)) throw notFound('Prompt')
  for (const prompt of db.prompts) prompt.active = prompt.version === version
  record(
    db,
    {
      type: 'prompt.activated',
      actor: 'operator',
      entityType: 'prompt',
      entityId: version,
      details: { by: user.name },
    },
    now,
  )
  return db.prompts
}

export type NewWorkOrder = {
  type: WorkOrderType
  alertId?: string
  drainId?: string
  priority: Priority
  crew: string
  note: string
}

function targetDrain(db: Db, input: NewWorkOrder): { drainId: string; alertId: string | null } {
  if (input.type === 'preventive') {
    const drain = findDrain(db, input.drainId ?? '')
    if (db.workOrders.some((order) => order.drainId === drain.id && isOpenWorkOrder(order))) {
      throw conflict('duplicate_order', 'Este bueiro já tem uma ordem aberta')
    }
    return { drainId: drain.id, alertId: null }
  }
  const alert = findAlert(db, input.alertId ?? '')
  if (alert.status !== 'confirmed') {
    throw conflict('alert_not_confirmed', 'Só alertas confirmados geram ordem de serviço')
  }
  if (db.workOrders.some((order) => order.alertId === alert.id && order.status !== 'cancelled')) {
    throw conflict('duplicate_order', 'Este alerta já tem uma ordem de serviço')
  }
  return { drainId: alert.drainId, alertId: alert.id }
}

export function createWorkOrder(db: Db, input: NewWorkOrder, user: User, now: Date) {
  const target = targetDrain(db, input)
  const id = nextCode(db, 'workOrder', 'OS')
  const at = now.toISOString()
  db.workOrders.push({
    id,
    type: input.type,
    ...target,
    status: 'open',
    priority: input.priority,
    crew: input.crew,
    note: input.note,
    createdBy: user.name,
    createdAt: at,
    updatedAt: at,
    history: [{ status: 'open', at, by: user.name }],
  })
  record(
    db,
    {
      type: 'work_order.created',
      actor: 'operator',
      entityType: 'work_order',
      entityId: id,
      details: { drainId: target.drainId, by: user.name, orderType: input.type },
    },
    now,
  )
  return workOrderView(db, id)
}

export function moveWorkOrder(db: Db, id: string, status: WorkOrderStatus, user: User, now: Date) {
  const order = db.workOrders.find((item) => item.id === id)
  if (!order) throw notFound('Ordem de serviço')
  if (!canTransitionWorkOrder(order.status, status)) {
    throw conflict('invalid_transition', 'Essa mudança de etapa não é permitida')
  }
  const from = order.status
  order.status = status
  order.updatedAt = now.toISOString()
  order.history.push({ status, at: order.updatedAt, by: user.name })
  if (status === 'done') {
    // The crew cleared the drain: telemetry goes back to normal and closes the alert by itself.
    delete db.simulation.scenarios[order.drainId]
    delete db.simulation.manual[order.drainId]
  }
  record(
    db,
    {
      type: 'work_order.status_changed',
      actor: 'operator',
      entityType: 'work_order',
      entityId: id,
      details: { drainId: order.drainId, by: user.name, from, to: status },
    },
    now,
  )
  return workOrderView(db, id)
}
