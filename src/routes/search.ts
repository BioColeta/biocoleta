import { z } from 'zod'

const text = z.string().optional().catch(undefined)
const choice = <const T extends [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined)

export const loginSearch = z.object({ redirect: text })
export const dashboardSearch = z.object({ district: text })
export const mapSearch = z.object({
  drain: text,
  status: choice(['normal', 'attention', 'obstructed', 'offline']),
  district: text,
  q: text,
})
export const alertsSearch = z.object({
  tab: choice(['new', 'confirmed', 'closed', 'all']),
  district: text,
  q: text,
})
export const devicesSearch = z.object({
  filter: choice(['offline', 'low_battery', 'tamper']),
  district: text,
})
export const historySearch = z.object({
  period: choice(['24h', '7d', 'all']),
  type: text,
  actor: choice(['system', 'operator', 'device']),
  entity: text,
})
export const planningSearch = z.object({
  intensity: z.coerce.number().min(0).max(150).optional().catch(undefined),
  duration: z.coerce.number().min(15).max(180).optional().catch(undefined),
})
