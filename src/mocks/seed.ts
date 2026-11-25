import { faker } from '@faker-js/faker/locale/pt_BR'
import { DEMO_CREDENTIALS, RULE } from '@/domain/constants'
import { seededRandom } from '@/domain/random'
import { generateValues } from '@/domain/scenarios'
import type { Alert, Reading, Scenario, WorkOrder, WorkOrderStatus } from '@/domain/types'
import locations from '@/mocks/data/drain-locations.json'
import terrain from '@/mocks/data/terrain.json'
import { SCHEMA_VERSION, type Db } from '@/mocks/db'
import { record } from '@/mocks/services/common'

const OPERATOR = 'Operador de demonstração'
const SEED_READINGS = 30
const TICK_MS = 5000

const prompts = [
  {
    version: 'v1',
    content:
      'Analise a janela de leituras de nível e fluxo. Informe a probabilidade de obstrução e justifique. Não execute ações.',
  },
  {
    version: 'v2',
    content:
      'Analise a janela de leituras, dando mais peso à estagnação do fluxo. Sinalize falha de sensor quando a qualidade for baixa. Responda no formato estruturado e não execute ações.',
  },
]

const initialScenarios: Record<string, Scenario> = {
  'BUEIRO-0318': 'obstruction',
  'BUEIRO-0771': 'flash_flood',
  'BUEIRO-0450': 'obstruction',
  'BUEIRO-0893': 'heavy_rain',
  'BUEIRO-1044': 'sensor_offline',
  'BUEIRO-1207': 'tamper',
}

const activeAlerts: { drainId: string; status: 'new' | 'confirmed'; minutesAgo: number }[] = [
  { drainId: 'BUEIRO-0318', status: 'new', minutesAgo: 4 },
  { drainId: 'BUEIRO-0771', status: 'new', minutesAgo: 11 },
  { drainId: 'BUEIRO-0450', status: 'confirmed', minutesAgo: 95 },
]

export function createSeed(now: Date): Db {
  faker.seed(2026)
  const random = seededRandom(2026)
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString()

  const db: Db = {
    schemaVersion: SCHEMA_VERSION,
    tick: 0,
    counters: { reading: 0, alert: 0, analysis: 0, workOrder: 0, audit: 0 },
    drains: locations.map((location) => ({
      ...location,
      ...terrain[location.id as keyof typeof terrain],
      detectionArmed: true,
    })),
    devices: [],
    telemetry: {},
    hourly: [],
    alerts: [],
    analyses: [],
    prompts: prompts.map((prompt, index) => ({
      ...prompt,
      active: index === prompts.length - 1,
      createdAt: ago((prompts.length - index) * 24 * 60),
    })),
    workOrders: [],
    audit: [],
    simulation: {
      running: true,
      tickMs: TICK_MS,
      speed: 1,
      aiMode: 'ok',
      scenarios: { ...initialScenarios },
      manual: {},
    },
  }

  for (const drain of db.drains) {
    const scenario = initialScenarios[drain.id] ?? 'normal'
    const offline = scenario === 'sensor_offline'
    const readings: Reading[] = []
    for (let index = 0; index < SEED_READINGS; index += 1) {
      const recent = index >= SEED_READINGS - 8
      const current = recent && !offline ? scenario : 'normal'
      const values = generateValues(current, random)!
      const age = (SEED_READINGS - 1 - index) * TICK_MS + (offline ? 120_000 : 0)
      db.counters.reading += 1
      readings.push({
        id: db.counters.reading,
        deviceId: drain.deviceId,
        recordedAt: new Date(now.getTime() - age).toISOString(),
        waterLevel: values.waterLevel,
        waterFlow: values.waterFlow,
        quality: values.quality,
        tamperAlert: values.tamper,
      })
    }
    db.telemetry[drain.deviceId] = readings
    db.devices.push({
      id: drain.deviceId,
      drainId: drain.id,
      battery: drain.id.endsWith('7')
        ? faker.number.int({ min: 6, max: 18 })
        : faker.number.int({ min: 35, max: 100 }),
      signalDbm: faker.number.int({ min: -92, max: -48 }),
      firmware: faker.helpers.arrayElement(['2.1.0', '2.2.3', '2.3.1']),
      lastSeenAt: readings.at(-1)!.recordedAt,
      lastSeenTick: offline ? -10 : 0,
      tamper: scenario === 'tamper',
    })
  }

  const districts = [...new Set(db.drains.map((drain) => drain.district))]
  for (let hoursAgo = 24; hoursAgo >= 1; hoursAgo -= 1) {
    const hour = new Date(now.getTime() - hoursAgo * 3600_000)
    hour.setUTCMinutes(0, 0, 0)
    const rain = Math.max(0, 22 - Math.abs(hoursAgo - 9) * 4)
    for (const district of districts) {
      const level = 22 + rain + random() * 6
      db.hourly.push({ hour: hour.toISOString(), district, sum: level * 10, count: 10 })
    }
  }

  seedHistory(db, ago)
  db.audit.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  db.audit.forEach((event, index) => (event.id = index + 1))
  return db
}

function seedHistory(db: Db, ago: (minutes: number) => string) {
  const log = (
    type: string,
    actor: 'system' | 'operator',
    entityType: 'alert' | 'work_order',
    entityId: string,
    details: Record<string, string | number>,
    at: string,
  ) => record(db, { type, actor, entityType, entityId, details }, new Date(at))

  const addAlert = (
    drainId: string,
    status: Alert['status'],
    createdMinutesAgo: number,
    decisionMinutes: number,
  ) => {
    const drain = db.drains.find((item) => item.id === drainId)!
    db.counters.alert += 1
    const id = `ALT-${String(db.counters.alert).padStart(4, '0')}`
    const createdAt = ago(createdMinutesAgo)
    const decided = status !== 'new'
    const decidedAt = decided ? ago(createdMinutesAgo - decisionMinutes) : null
    const clearedAt = status === 'cleared' ? ago(createdMinutesAgo - decisionMinutes - 55) : null
    const evidence: Reading[] = [1, 0].map((offset) => ({
      id: -(db.counters.alert * 2 + offset),
      deviceId: drain.deviceId,
      recordedAt: ago(createdMinutesAgo + offset / 12),
      waterLevel: 82 + offset * 2,
      waterFlow: 0.02,
      quality: 0.96,
      tamperAlert: false,
    }))
    db.alerts.push({
      id,
      drainId,
      deviceId: drain.deviceId,
      status,
      ruleId: RULE.id,
      evidence: {
        thresholds: {
          levelMin: RULE.levelMin,
          flowMax: RULE.flowMax,
          consecutive: RULE.consecutive,
        },
        readings: evidence,
      },
      createdAt,
      decidedAt,
      decidedBy: decided ? OPERATOR : null,
      decisionNote: null,
      clearedAt,
    })
    log('alert.created', 'system', 'alert', id, { drainId }, createdAt)
    if (decidedAt) {
      const outcome = status === 'false_positive' ? 'false_positive' : 'confirmed'
      log(
        `alert.${outcome}`,
        'operator',
        'alert',
        id,
        { drainId, by: OPERATOR, minutesToDecision: decisionMinutes },
        decidedAt,
      )
    }
    if (clearedAt) log('alert.cleared', 'system', 'alert', id, { drainId }, clearedAt)
    return db.alerts.at(-1)!
  }

  const addOrder = (alert: Alert, status: WorkOrderStatus) => {
    db.counters.workOrder += 1
    const id = `OS-${String(db.counters.workOrder).padStart(4, '0')}`
    const steps: WorkOrderStatus[] = ['open', 'dispatched', 'in_progress', 'done']
    const start = Date.parse(alert.decidedAt!)
    const history = steps.slice(0, steps.indexOf(status) + 1).map((step, index) => ({
      status: step,
      at: new Date(start + (index + 1) * 5 * 60_000).toISOString(),
      by: OPERATOR,
    }))
    const order: WorkOrder = {
      id,
      type: 'corrective',
      alertId: alert.id,
      drainId: alert.drainId,
      status,
      priority: faker.helpers.arrayElement(['medium', 'high']),
      crew: faker.helpers.arrayElement(['Equipe Norte', 'Equipe Centro', 'Equipe Sul']),
      note: 'Desobstrução e limpeza da grelha.',
      createdBy: DEMO_CREDENTIALS.username,
      createdAt: history[0].at,
      updatedAt: history.at(-1)!.at,
      history,
    }
    db.workOrders.push(order)
    log(
      'work_order.created',
      'operator',
      'work_order',
      id,
      { drainId: alert.drainId, by: OPERATOR },
      order.createdAt,
    )
    for (let index = 1; index < history.length; index += 1) {
      log(
        'work_order.status_changed',
        'operator',
        'work_order',
        id,
        {
          drainId: alert.drainId,
          by: OPERATOR,
          from: history[index - 1].status,
          to: history[index].status,
        },
        history[index].at,
      )
    }
  }

  const pool = db.drains.filter((drain) => !(drain.id in initialScenarios)).slice(0, 8)
  for (let index = 0; index < 18; index += 1) {
    const drain = faker.helpers.arrayElement(pool)
    const falsePositive = index % 5 === 4
    const alert = addAlert(
      drain.id,
      falsePositive ? 'false_positive' : 'cleared',
      6 * 24 * 60 - index * 460 + faker.number.int({ min: 0, max: 90 }),
      faker.number.int({ min: 3, max: 45 }),
    )
    if (index % 6 === 1) addOrder(alert, 'done')
  }
  for (const item of activeAlerts) {
    const alert = addAlert(item.drainId, item.status, item.minutesAgo, 12)
    if (item.status === 'confirmed') addOrder(alert, 'dispatched')
  }
  const pending = addAlert('BUEIRO-1366', 'confirmed', 140, 8)
  addOrder(pending, 'open')
  db.simulation.scenarios['BUEIRO-1366'] = 'obstruction'
  const readings = db.telemetry[pending.deviceId]
  readings
    .slice(-8)
    .forEach((reading) => Object.assign(reading, { waterLevel: 83, waterFlow: 0.02 }))
}
