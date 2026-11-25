// @vitest-environment node
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { DEMO_CREDENTIALS, DEMO_DEVICE_KEY } from '@/domain/constants'
import { buildPayload } from '@/domain/telemetry'
import type { Alert, Analysis, DrainView, Reading, WorkOrderView } from '@/domain/types'
import { resetDb } from '@/mocks/db'
import { createHandlers } from '@/mocks/handlers'

const server = setupServer(...createHandlers())
const drain = { id: 'BUEIRO-0102', deviceId: 'ESP32-DRAIN-0102' }
const blocked = { waterLevel: 85, waterFlow: 0.01, quality: 0.97, tamper: false }
const normal = { waterLevel: 20, waterFlow: 2.5, quality: 0.97, tamper: false }
let token = ''

async function call<T>(path: string, method = 'GET', body?: unknown, headers = {}) {
  const response = await fetch(`http://localhost/api${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, data: (await response.json()) as T }
}

const send = (values: typeof blocked, key = DEMO_DEVICE_KEY) =>
  call<{ id: number; alertId: string | null }>(
    '/telemetry',
    'POST',
    buildPayload(drain, values, new Date()),
    { 'X-Device-Key': key },
  )

const raiseAlert = async () => {
  await send(blocked)
  return (await send(blocked)).data.alertId!
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(async () => {
  await resetDb()
  const login = await call<{ token: string }>('/auth/login', 'POST', DEMO_CREDENTIALS)
  token = login.data.token
})

describe('authentication', () => {
  it('rejects bad credentials and requests without a session', async () => {
    const bad = await call('/auth/login', 'POST', { username: 'operator', password: 'nope' })
    expect(bad.status).toBe(401)
    token = ''
    expect((await call('/alerts')).status).toBe(401)
  })
})

describe('telemetry and detection', () => {
  it('creates exactly one alert with evidence after consecutive anomalous readings', async () => {
    const first = await send(blocked)
    expect(first).toMatchObject({ status: 201, data: { alertId: null } })
    const alertId = (await send(blocked)).data.alertId!
    expect((await send(blocked)).data.alertId).toBeNull()
    const alert = await call<Alert>(`/alerts/${alertId}`)
    expect(alert.data.status).toBe('new')
    expect(alert.data.evidence.readings).toHaveLength(2)
  })

  it('clears the alert and frees the drain when readings normalize', async () => {
    const alertId = await raiseAlert()
    await send(normal)
    expect((await call<Alert>(`/alerts/${alertId}`)).data.status).toBe('cleared')
    expect((await call<DrainView>(`/drains/${drain.id}`)).data.status).toBe('normal')
  })

  it('refuses a wrong device key or invalid payload without persisting', async () => {
    const count = async () =>
      (await call<Reading[]>(`/drains/${drain.id}/telemetry?limit=200`)).data.length
    const before = await count()
    expect((await send(blocked, 'wrong')).status).toBe(401)
    const invalid = await call(
      '/telemetry',
      'POST',
      { device_id: drain.deviceId },
      {
        'X-Device-Key': DEMO_DEVICE_KEY,
      },
    )
    expect(invalid.status).toBe(400)
    expect(await count()).toBe(before)
  })

  it('restores the seed on reset', async () => {
    const before = (await call<Alert[]>('/alerts')).data.length
    await raiseAlert()
    await call('/demo/reset', 'POST')
    expect((await call<Alert[]>('/alerts')).data).toHaveLength(before)
  })
})

describe('decisions', () => {
  it('records the author and keeps a confirmed drain obstructed', async () => {
    const alertId = await raiseAlert()
    const decided = await call<Alert>(`/alerts/${alertId}/decision`, 'POST', {
      outcome: 'confirmed',
      note: 'Ver no local',
    })
    expect(decided.data).toMatchObject({ status: 'confirmed', decisionNote: 'Ver no local' })
    expect(decided.data.decidedBy).toBeTruthy()
    expect((await call<DrainView>(`/drains/${drain.id}`)).data.status).toBe('obstructed')
    const again = await call(`/alerts/${alertId}/decision`, 'POST', { outcome: 'confirmed' })
    expect(again.status).toBe(409)
  })

  it('does not alert again after a false positive until a normal reading', async () => {
    const alertId = await raiseAlert()
    await call(`/alerts/${alertId}/decision`, 'POST', { outcome: 'false_positive' })
    expect(await raiseAlert()).toBeNull()
    await send(normal)
    expect(await raiseAlert()).not.toBeNull()
  })
})

describe('analysis', () => {
  const setMode = (aiMode: string) => call('/demo/simulation', 'PUT', { aiMode })

  it('recognises an obstruction as soon as the alert is created', async () => {
    await send(normal)
    await send(normal)
    const alertId = await raiseAlert()
    const analysis = await call<Analysis>(`/alerts/${alertId}/analysis`, 'POST')
    expect(analysis.data).toMatchObject({ classification: 'obstruction', probability: 1 })
  })

  it('records the active prompt version and never changes the alert', async () => {
    const alertId = await raiseAlert()
    const first = await call<Analysis>(`/alerts/${alertId}/analysis`, 'POST')
    expect(first.data.promptVersion).toBe('v2')
    await call('/prompts/v1/activate', 'PUT')
    expect((await call<Analysis>(`/alerts/${alertId}/analysis`, 'POST')).data.promptVersion).toBe(
      'v1',
    )
    const history = await call<Analysis[]>(`/alerts/${alertId}/analyses`)
    expect(history.data.map((item) => item.promptVersion)).toEqual(['v1', 'v2'])
    expect((await call<Alert>(`/alerts/${alertId}`)).data.status).toBe('new')
    expect(
      (await call<WorkOrderView[]>('/work-orders')).data.every((o) => o.alertId !== alertId),
    ).toBe(true)
  })

  it.each([
    ['unavailable', 503],
    ['invalid', 502],
  ])('fails when the analyzer is %s and stores nothing', async (mode, status) => {
    const alertId = await raiseAlert()
    await setMode(mode)
    expect((await call(`/alerts/${alertId}/analysis`, 'POST')).status).toBe(status)
    expect((await call<Analysis[]>(`/alerts/${alertId}/analyses`)).data).toEqual([])
  })
})

describe('work orders', () => {
  const order = (alertId: string) => ({
    type: 'corrective',
    alertId,
    priority: 'high',
    crew: 'Equipe Centro',
    note: '',
  })
  const confirm = async () => {
    const alertId = await raiseAlert()
    await call(`/alerts/${alertId}/decision`, 'POST', { outcome: 'confirmed' })
    return alertId
  }

  it('requires a confirmed alert and refuses a second order', async () => {
    const alertId = await raiseAlert()
    expect((await call('/work-orders', 'POST', order(alertId))).status).toBe(409)
    await call(`/alerts/${alertId}/decision`, 'POST', { outcome: 'confirmed' })
    expect((await call('/work-orders', 'POST', order(alertId))).status).toBe(201)
    expect((await call('/work-orders', 'POST', order(alertId))).status).toBe(409)
  })

  it('walks the allowed steps and leaves clearing to telemetry', async () => {
    const alertId = await confirm()
    const created = await call<WorkOrderView>('/work-orders', 'POST', order(alertId))
    const move = (status: string) =>
      call<WorkOrderView>(`/work-orders/${created.data.id}`, 'PATCH', { status })
    expect((await move('done')).status).toBe(409)
    await move('dispatched')
    await move('in_progress')
    expect((await move('done')).data.status).toBe('done')
    expect((await call<Alert>(`/alerts/${alertId}`)).data.status).toBe('confirmed')
    await send(normal)
    expect((await call<Alert>(`/alerts/${alertId}`)).data.status).toBe('cleared')
  })

  it('allows one open preventive order per drain, without an alert', async () => {
    const preventive = { ...order(''), type: 'preventive', alertId: undefined, drainId: drain.id }
    const created = await call<WorkOrderView>('/work-orders', 'POST', preventive)
    expect(created.data).toMatchObject({ type: 'preventive', alertId: null })
    expect((await call('/work-orders', 'POST', preventive)).status).toBe(409)
  })
})

describe('seed', () => {
  it('has fifty drains covering every status', async () => {
    const { data } = await call<DrainView[]>('/drains')
    expect(data).toHaveLength(50)
    expect(new Set(data.map((item) => item.status))).toEqual(
      new Set(['normal', 'attention', 'obstructed', 'offline']),
    )
  })
})
