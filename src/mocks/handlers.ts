import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import { DEMO_CREDENTIALS, DEMO_DEVICE_KEY } from '@/domain/constants'
import { payloadSchema } from '@/domain/telemetry'
import {
  decisionOutcomeSchema,
  prioritySchema,
  workOrderStatusSchema,
  workOrderTypeSchema,
  type User,
} from '@/domain/types'
import { mutate, readDb, resetDb } from '@/mocks/db'
import { ServiceError } from '@/mocks/services/common'
import * as operations from '@/mocks/services/operations'
import * as queries from '@/mocks/services/queries'
import { simulationPatchSchema, updateSimulation } from '@/mocks/services/simulation'
import { ingest } from '@/mocks/services/telemetry'

const TOKEN = 'demo-session-token'
const operator: User = { username: DEMO_CREDENTIALS.username, name: 'Operador de demonstração' }

const loginSchema = z.object({ username: z.string(), password: z.string() })
const decisionSchema = z.object({
  outcome: decisionOutcomeSchema,
  note: z.string().max(500).optional(),
})
const workOrderInput = z.object({
  type: workOrderTypeSchema,
  alertId: z.string().optional(),
  drainId: z.string().optional(),
  priority: prioritySchema,
  crew: z.string().trim().min(1).max(60),
  note: z.string().max(500),
})
const statusInput = z.object({ status: workOrderStatusSchema })

const errorResponse = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status })

type Context = { request: Request; params: Record<string, string> }

async function body<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const json: unknown = await request.json().catch(() => undefined)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Corpo inválido'
    throw new ServiceError(400, 'invalid_body', message)
  }
  return parsed.data
}

function handle(resolve: (context: Context) => unknown, status = 200) {
  return async ({ request, params }: { request: Request; params: unknown }) => {
    try {
      const result = await resolve({ request, params: params as Record<string, string> })
      return HttpResponse.json(result as object, { status })
    } catch (error) {
      if (error instanceof ServiceError) {
        return errorResponse(error.status, error.code, error.message)
      }
      console.error(error)
      return errorResponse(500, 'unexpected', 'Erro inesperado na API simulada')
    }
  }
}

function secured(resolve: (context: Context) => unknown, status = 200) {
  const inner = handle(resolve, status)
  return (info: { request: Request; params: unknown }) =>
    info.request.headers.get('Authorization') === `Bearer ${TOKEN}`
      ? inner(info)
      : errorResponse(401, 'unauthorized', 'Sessão inválida ou expirada')
}

export function createHandlers({ analysisDelayMs = 0 } = {}) {
  return [
    http.post(
      '*/api/auth/login',
      handle(async ({ request }) => {
        const { username, password } = await body(request, loginSchema)
        if (username !== DEMO_CREDENTIALS.username || password !== DEMO_CREDENTIALS.password) {
          throw new ServiceError(401, 'invalid_credentials', 'Usuário ou senha inválidos')
        }
        return { token: TOKEN, user: operator }
      }),
    ),
    http.post(
      '*/api/auth/logout',
      secured(() => ({ ok: true })),
    ),
    http.get(
      '*/api/auth/me',
      secured(() => operator),
    ),

    http.post(
      '*/api/telemetry',
      handle(async ({ request }) => {
        if (request.headers.get('X-Device-Key') !== DEMO_DEVICE_KEY) {
          throw new ServiceError(401, 'invalid_device_key', 'Chave de dispositivo inválida')
        }
        const input = await body(request, payloadSchema)
        return mutate((db) => ingest(db, input, new Date()))
      }, 201),
    ),

    http.get(
      '*/api/drains',
      secured(() => queries.listDrains(readDb())),
    ),
    http.get(
      '*/api/drains/:id',
      secured(({ params }) => queries.getDrain(readDb(), params.id)),
    ),
    http.get(
      '*/api/drains/:id/telemetry',
      secured(({ params, request }) => {
        const limit = Number(new URL(request.url).searchParams.get('limit')) || 60
        return queries.drainTelemetry(readDb(), params.id, limit)
      }),
    ),
    http.get(
      '*/api/devices',
      secured(() => queries.listDevices(readDb())),
    ),
    http.get(
      '*/api/devices/:id',
      secured(({ params }) => queries.getDevice(readDb(), params.id)),
    ),

    http.get(
      '*/api/alerts',
      secured(() => queries.listAlerts(readDb())),
    ),
    http.get(
      '*/api/alerts/:id',
      secured(({ params }) => queries.alertView(readDb(), params.id)),
    ),
    http.post(
      '*/api/alerts/:id/decision',
      secured(async ({ params, request }) => {
        const decision = await body(request, decisionSchema)
        return mutate((db) => operations.decide(db, params.id, decision, operator, new Date()))
      }),
    ),
    http.post(
      '*/api/alerts/:id/analysis',
      secured(async ({ params }) => {
        if (analysisDelayMs) await delay(analysisDelayMs * (0.5 + Math.random()))
        return mutate((db) => operations.analyze(db, params.id, new Date()))
      }, 201),
    ),
    http.get(
      '*/api/alerts/:id/analyses',
      secured(({ params }) => {
        const db = readDb()
        queries.alertView(db, params.id)
        return db.analyses.filter((item) => item.alertId === params.id).reverse()
      }),
    ),

    http.get(
      '*/api/prompts',
      secured(() => readDb().prompts),
    ),
    http.put(
      '*/api/prompts/:version/activate',
      secured(({ params }) =>
        mutate((db) => operations.activatePrompt(db, params.version, operator, new Date())),
      ),
    ),

    http.get(
      '*/api/work-orders',
      secured(() => queries.listWorkOrders(readDb())),
    ),
    http.post(
      '*/api/work-orders',
      secured(async ({ request }) => {
        const input = await body(request, workOrderInput)
        return mutate((db) => operations.createWorkOrder(db, input, operator, new Date()))
      }, 201),
    ),
    http.patch(
      '*/api/work-orders/:id',
      secured(async ({ params, request }) => {
        const { status } = await body(request, statusInput)
        return mutate((db) => operations.moveWorkOrder(db, params.id, status, operator, new Date()))
      }),
    ),

    http.get(
      '*/api/dashboard/summary',
      secured(({ request }) => {
        const district = new URL(request.url).searchParams.get('district') ?? undefined
        return queries.summary(readDb(), district, new Date())
      }),
    ),
    http.get(
      '*/api/audit',
      secured(() => queries.listAudit(readDb())),
    ),

    http.get(
      '*/api/demo/drains',
      handle(() => queries.listDemoDrains(readDb())),
    ),
    http.get(
      '*/api/demo/simulation',
      handle(() => readDb().simulation),
    ),
    http.put(
      '*/api/demo/simulation',
      handle(async ({ request }) => {
        const patch = await body(request, simulationPatchSchema)
        return mutate((db) => updateSimulation(db, patch, new Date()))
      }),
    ),
    http.post(
      '*/api/demo/reset',
      handle(async () => {
        await resetDb()
        return { ok: true }
      }),
    ),
  ]
}
