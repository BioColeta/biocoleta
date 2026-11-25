import { OFFLINE_AFTER_TICKS } from '@/domain/constants'
import { dashboardSummary } from '@/domain/metrics'
import { drainStatus, isOpenAlert } from '@/domain/rules'
import type {
  AlertView,
  DemoDrain,
  DeviceView,
  Drain,
  DrainView,
  WorkOrderView,
} from '@/domain/types'
import type { Db } from '@/mocks/db'
import { findDrain, notFound } from './common'

export function drainView(db: Db, drain: Drain): DrainView {
  const device = db.devices.find((item) => item.id === drain.deviceId)!
  const lastReading = db.telemetry[drain.deviceId]?.at(-1) ?? null
  const openAlert = db.alerts.find(
    (alert) => alert.drainId === drain.id && isOpenAlert(alert.status),
  )
  const status = drainStatus({
    hasOpenAlert: Boolean(openAlert),
    ticksSinceSeen: db.tick - device.lastSeenTick,
    latestLevel: lastReading?.waterLevel ?? null,
  })
  return { ...drain, status, openAlertId: openAlert?.id ?? null, lastReading }
}

export const listDrains = (db: Db) => db.drains.map((drain) => drainView(db, drain))

export const getDrain = (db: Db, id: string) => drainView(db, findDrain(db, id))

export function drainTelemetry(db: Db, id: string, limit = 60) {
  const drain = findDrain(db, id)
  return (db.telemetry[drain.deviceId] ?? []).slice(-limit)
}

function deviceView(db: Db, deviceId: string): DeviceView {
  const device = db.devices.find((item) => item.id === deviceId)
  if (!device) throw notFound('Dispositivo')
  const view = getDrain(db, device.drainId)
  return {
    ...device,
    status: view.status,
    offline: db.tick - device.lastSeenTick >= OFFLINE_AFTER_TICKS,
    district: view.district,
    lastReading: view.lastReading,
  }
}

export const listDevices = (db: Db) => db.devices.map((device) => deviceView(db, device.id))
export const getDevice = deviceView

export function alertView(db: Db, id: string): AlertView {
  const alert = db.alerts.find((item) => item.id === id)
  if (!alert) throw notFound('Alerta')
  const { district, address } = findDrain(db, alert.drainId)
  return { ...alert, district, address }
}

export const listAlerts = (db: Db) =>
  db.alerts
    .map((alert) => alertView(db, alert.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export function workOrderView(db: Db, id: string): WorkOrderView {
  const order = db.workOrders.find((item) => item.id === id)
  if (!order) throw notFound('Ordem de serviço')
  const { district, address } = findDrain(db, order.drainId)
  const alert = db.alerts.find((item) => item.id === order.alertId)
  return { ...order, district, address, alertStatus: alert?.status ?? null }
}

export const listWorkOrders = (db: Db) => db.workOrders.map((order) => workOrderView(db, order.id))

function openAlertOf(db: Db, id: string | null) {
  const alert = db.alerts.find((item) => item.id === id)
  return alert ? { id: alert.id, status: alert.status } : null
}

export const listDemoDrains = (db: Db): DemoDrain[] =>
  listDrains(db).map((drain) => ({
    id: drain.id,
    deviceId: drain.deviceId,
    district: drain.district,
    status: drain.status,
    scenario: db.simulation.scenarios[drain.id] ?? 'normal',
    lastReading: drain.lastReading,
    openAlert: openAlertOf(db, drain.openAlertId),
  }))

export const summary = (db: Db, district: string | undefined, now: Date) =>
  dashboardSummary({
    drains: listDrains(db),
    alerts: db.alerts,
    hourly: db.hourly,
    district,
    now,
  })

export const listAudit = (db: Db) => [...db.audit].reverse()
