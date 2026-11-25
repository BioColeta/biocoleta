import { z } from 'zod'

const isoDate = z.string()

export const drainStatusSchema = z.enum(['normal', 'attention', 'obstructed', 'offline'])
export const alertStatusSchema = z.enum(['new', 'confirmed', 'false_positive', 'cleared'])
export const decisionOutcomeSchema = z.enum(['confirmed', 'false_positive'])
export const workOrderStatusSchema = z.enum([
  'open',
  'dispatched',
  'in_progress',
  'done',
  'cancelled',
])
export const workOrderTypeSchema = z.enum(['corrective', 'preventive'])
export const prioritySchema = z.enum(['low', 'medium', 'high'])
export const scenarioSchema = z.enum([
  'normal',
  'heavy_rain',
  'obstruction',
  'flash_flood',
  'sensor_offline',
  'tamper',
  'manual',
])
export const aiModeSchema = z.enum(['ok', 'unavailable', 'invalid'])
export const classificationSchema = z.enum([
  'obstruction',
  'sensor_fault',
  'normal',
  'inconclusive',
])

export const terrainSchema = z.object({
  elevationM: z.number(),
  downstreamDrainId: z.string().nullable(),
  catchmentAreaM2: z.number(),
  runoffCoefficient: z.number().min(0).max(1),
  capacityLps: z.number().positive(),
})

export const drainSchema = terrainSchema.extend({
  id: z.string(),
  deviceId: z.string(),
  district: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  detectionArmed: z.boolean(),
})

export const deviceSchema = z.object({
  id: z.string(),
  drainId: z.string(),
  battery: z.number(),
  signalDbm: z.number(),
  firmware: z.string(),
  lastSeenAt: isoDate,
  lastSeenTick: z.number(),
  tamper: z.boolean(),
})

export const readingSchema = z.object({
  id: z.number(),
  deviceId: z.string(),
  recordedAt: isoDate,
  waterLevel: z.number().min(0).max(100),
  waterFlow: z.number().min(0),
  quality: z.number().min(0).max(1),
  tamperAlert: z.boolean(),
})

export const alertSchema = z.object({
  id: z.string(),
  drainId: z.string(),
  deviceId: z.string(),
  status: alertStatusSchema,
  ruleId: z.string(),
  evidence: z.object({
    thresholds: z.object({ levelMin: z.number(), flowMax: z.number(), consecutive: z.number() }),
    readings: z.array(readingSchema),
  }),
  createdAt: isoDate,
  decidedAt: isoDate.nullable(),
  decidedBy: z.string().nullable(),
  decisionNote: z.string().nullable(),
  clearedAt: isoDate.nullable(),
})

export const analysisSchema = z.object({
  id: z.string(),
  alertId: z.string(),
  probability: z.number().min(0).max(1),
  classification: classificationSchema,
  explanation: z.string().min(1),
  readingIds: z.array(z.number()),
  promptVersion: z.string(),
  createdAt: isoDate,
})

export const promptSchema = z.object({
  version: z.string(),
  content: z.string(),
  active: z.boolean(),
  createdAt: isoDate,
})

export const workOrderSchema = z.object({
  id: z.string(),
  type: workOrderTypeSchema,
  alertId: z.string().nullable(),
  drainId: z.string(),
  status: workOrderStatusSchema,
  priority: prioritySchema,
  crew: z.string(),
  note: z.string(),
  createdBy: z.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
  history: z.array(z.object({ status: workOrderStatusSchema, at: isoDate, by: z.string() })),
})

export const auditSchema = z.object({
  id: z.number(),
  type: z.string(),
  actor: z.enum(['system', 'operator', 'device']),
  entityType: z.enum(['alert', 'work_order', 'device', 'prompt', 'simulation']),
  entityId: z.string(),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  createdAt: isoDate,
})

export const manualValuesSchema = z.object({
  waterLevel: z.number().min(0).max(100),
  waterFlow: z.number().min(0).max(10),
  quality: z.number().min(0).max(1),
  tamper: z.boolean(),
})

export const simulationSchema = z.object({
  running: z.boolean(),
  tickMs: z.number().int().min(500).max(60000),
  speed: z.union([z.literal(1), z.literal(5)]),
  aiMode: aiModeSchema,
  scenarios: z.record(z.string(), scenarioSchema),
  manual: z.record(z.string(), manualValuesSchema),
})

export type DrainStatus = z.infer<typeof drainStatusSchema>
export type AlertStatus = z.infer<typeof alertStatusSchema>
export type DecisionOutcome = z.infer<typeof decisionOutcomeSchema>
export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>
export type WorkOrderType = z.infer<typeof workOrderTypeSchema>
export type Priority = z.infer<typeof prioritySchema>
export type Scenario = z.infer<typeof scenarioSchema>
export type AiMode = z.infer<typeof aiModeSchema>
export type Classification = z.infer<typeof classificationSchema>
export type Terrain = z.infer<typeof terrainSchema>
export type Drain = z.infer<typeof drainSchema>
export type Device = z.infer<typeof deviceSchema>
export type Reading = z.infer<typeof readingSchema>
export type Alert = z.infer<typeof alertSchema>
export type Analysis = z.infer<typeof analysisSchema>
export type Prompt = z.infer<typeof promptSchema>
export type WorkOrder = z.infer<typeof workOrderSchema>
export type AuditEvent = z.infer<typeof auditSchema>
export type ManualValues = z.infer<typeof manualValuesSchema>
export type Simulation = z.infer<typeof simulationSchema>

export type DrainView = Drain & {
  status: DrainStatus
  openAlertId: string | null
  lastReading: Reading | null
}
export type DeviceView = Device & {
  status: DrainStatus
  offline: boolean
  district: string
  lastReading: Reading | null
}
export type AlertView = Alert & { district: string; address: string }
export type WorkOrderView = WorkOrder & {
  district: string
  address: string
  alertStatus: AlertStatus | null
}
export type DemoDrain = {
  id: string
  deviceId: string
  district: string
  status: DrainStatus
  scenario: Scenario
  lastReading: Reading | null
}
export type User = { username: string; name: string }
