import { describe, expect, it } from 'vitest'
import { seededRandom } from '@/domain/random'
import { scenarioRanges } from '@/domain/scenarios'
import type { Scenario } from '@/domain/types'
import type { Db } from '@/mocks/db'
import { createSeed } from '@/mocks/seed'
import { moveWorkOrder } from '@/mocks/services/operations'
import { drainView } from '@/mocks/services/queries'
import { updateSimulation } from '@/mocks/services/simulation'
import { runTick } from './tick'

const now = new Date('2026-11-25T12:00:00Z')
const ID = 'BUEIRO-0102'

function world(scenario: Scenario = 'normal') {
  const db = createSeed(now)
  updateSimulation(db, { scenario: { drainId: ID, scenario } }, now)
  return db
}

function advance(db: Db, ticks: number) {
  const random = seededRandom(1)
  for (let index = 1; index <= ticks; index += 1) {
    runTick(db, random, new Date(now.getTime() + index * 5000))
  }
}

const drain = (db: Db) =>
  drainView(
    db,
    db.drains.find((item) => item.id === ID)!,
  )

describe('runTick', () => {
  it('adds one reading per active device', () => {
    const db = world()
    const before = db.counters.reading
    advance(db, 2)
    expect(db.counters.reading - before).toBe(db.drains.length * 2 - 2)
  })

  it.each([
    ['normal', 'normal'],
    ['heavy_rain', 'attention'],
    ['obstruction', 'obstructed'],
    ['flash_flood', 'obstructed'],
    ['sensor_offline', 'offline'],
  ] as const)('drives a drain in %s to %s', (scenario, status) => {
    const db = world(scenario)
    advance(db, 3)
    expect(drain(db).status).toBe(status)
  })

  it.each(['normal', 'heavy_rain', 'obstruction', 'flash_flood'] as const)(
    'keeps %s readings inside the specified ranges',
    (scenario) => {
      const db = world(scenario)
      advance(db, 20)
      const { level, flow } = scenarioRanges[scenario]
      for (const reading of db.telemetry[drain(db).deviceId].slice(-20)) {
        expect(reading.waterLevel).toBeGreaterThanOrEqual(level[0])
        expect(reading.waterLevel).toBeLessThanOrEqual(level[1])
        expect(reading.waterFlow).toBeGreaterThanOrEqual(flow[0])
        expect(reading.waterFlow).toBeLessThanOrEqual(flow[1])
      }
    },
  )

  it('does not move time or mark devices offline while paused', () => {
    const db = world()
    db.simulation.running = false
    advance(db, 10)
    expect(db.tick).toBe(0)
    expect(drain(db).status).toBe('normal')
  })

  it('records tampering once, when it starts', () => {
    const db = world('tamper')
    advance(db, 3)
    const events = db.audit.filter(
      (event) => event.type === 'device.tamper_detected' && event.entityId === drain(db).deviceId,
    )
    expect(events).toHaveLength(1)
  })

  it('closes the alert by telemetry after the work order is done', () => {
    const db = createSeed(now)
    const order = db.workOrders.find((item) => item.status === 'dispatched')!
    const user = { username: 'operator', name: 'Operador' }
    moveWorkOrder(db, order.id, 'in_progress', user, now)
    moveWorkOrder(db, order.id, 'done', user, now)
    advance(db, 1)
    expect(db.alerts.find((alert) => alert.id === order.alertId)!.status).toBe('cleared')
  })

  it('turns the storm preset into rain and at least two obstructions', () => {
    const db = createSeed(now)
    updateSimulation(db, { preset: 'storm' }, now)
    const values = Object.values(db.simulation.scenarios)
    expect(values.filter((value) => value === 'heavy_rain').length).toBeGreaterThan(5)
    expect(values.filter((value) => value === 'obstruction').length).toBeGreaterThanOrEqual(2)
  })
})
