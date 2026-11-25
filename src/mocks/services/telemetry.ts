import { RULE } from '@/domain/constants'
import { evaluateDetection, isOpenAlert } from '@/domain/rules'
import type { TelemetryInput } from '@/domain/telemetry'
import type { Reading } from '@/domain/types'
import { READINGS_PER_DEVICE, type Db } from '@/mocks/db'
import { nextCode, record, ServiceError } from './common'

const HOURS_KEPT = 25

function addToHourlyLevel(db: Db, district: string, reading: Reading) {
  const hour = new Date(reading.recordedAt)
  hour.setUTCMinutes(0, 0, 0)
  const key = hour.toISOString()
  const bucket = db.hourly.find((item) => item.hour === key && item.district === district)
  if (bucket) {
    bucket.sum += reading.waterLevel
    bucket.count += 1
    return
  }
  db.hourly.push({ hour: key, district, sum: reading.waterLevel, count: 1 })
  const oldest = new Date(hour.getTime() - HOURS_KEPT * 3600_000).toISOString()
  db.hourly = db.hourly.filter((item) => item.hour >= oldest)
}

export function ingest(db: Db, input: TelemetryInput, now: Date) {
  const device = db.devices.find((item) => item.id === input.deviceId)
  const drain = db.drains.find((item) => item.deviceId === input.deviceId)
  if (!device || !drain || drain.id !== input.drainId) {
    throw new ServiceError(400, 'unknown_device', 'Dispositivo ou bueiro desconhecido')
  }

  db.counters.reading += 1
  const { drainId, ...values } = input
  const reading: Reading = { id: db.counters.reading, ...values }
  const history = (db.telemetry[device.id] ??= [])
  history.push(reading)
  if (history.length > READINGS_PER_DEVICE) history.splice(0, history.length - READINGS_PER_DEVICE)
  addToHourlyLevel(db, drain.district, reading)

  if (reading.tamperAlert && !device.tamper) {
    record(
      db,
      {
        type: 'device.tamper_detected',
        actor: 'device',
        entityType: 'device',
        entityId: device.id,
        details: { drainId },
      },
      now,
    )
  }
  device.tamper = reading.tamperAlert
  device.lastSeenAt = now.toISOString()
  device.lastSeenTick = db.tick

  const open = db.alerts.filter((alert) => alert.drainId === drain.id && isOpenAlert(alert.status))
  const window = history.slice(-RULE.consecutive)
  const detection = evaluateDetection({
    readings: window,
    hasOpenAlert: open.length > 0,
    armed: drain.detectionArmed,
  })

  if (detection === 'clear') {
    drain.detectionArmed = true
    for (const alert of open) {
      alert.status = 'cleared'
      alert.clearedAt = now.toISOString()
      record(
        db,
        {
          type: 'alert.cleared',
          actor: 'system',
          entityType: 'alert',
          entityId: alert.id,
          details: { drainId },
        },
        now,
      )
    }
  }
  if (detection === 'rearm') drain.detectionArmed = true

  let alertId: string | null = null
  if (detection === 'create') {
    alertId = nextCode(db, 'alert', 'ALT')
    db.alerts.push({
      id: alertId,
      drainId: drain.id,
      deviceId: device.id,
      status: 'new',
      ruleId: RULE.id,
      evidence: {
        thresholds: {
          levelMin: RULE.levelMin,
          flowMax: RULE.flowMax,
          consecutive: RULE.consecutive,
        },
        readings: window.map((item) => ({ ...item })),
      },
      createdAt: now.toISOString(),
      decidedAt: null,
      decidedBy: null,
      decisionNote: null,
      clearedAt: null,
    })
    record(
      db,
      {
        type: 'alert.created',
        actor: 'system',
        entityType: 'alert',
        entityId: alertId,
        details: { drainId },
      },
      now,
    )
  }
  return { id: reading.id, alertId }
}
