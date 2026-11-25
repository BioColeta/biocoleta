import { ATTENTION_LEVEL_MIN, OFFLINE_AFTER_TICKS, RULE } from './constants.ts'
import type { AlertStatus, DrainStatus, Reading } from './types.ts'

type Measure = Pick<Reading, 'waterLevel' | 'waterFlow'>

export function isAnomalous({ waterLevel, waterFlow }: Measure): boolean {
  return waterLevel >= RULE.levelMin && waterFlow <= RULE.flowMax
}

export type Detection = 'create' | 'clear' | 'rearm' | 'none'

type DetectionInput = {
  /** Latest readings of one device, oldest first. */
  readings: Measure[]
  hasOpenAlert: boolean
  armed: boolean
}

export function evaluateDetection({ readings, hasOpenAlert, armed }: DetectionInput): Detection {
  const latest = readings.at(-1)
  if (!latest) return 'none'
  if (!isAnomalous(latest)) {
    if (hasOpenAlert) return 'clear'
    return armed ? 'none' : 'rearm'
  }
  const window = readings.slice(-RULE.consecutive)
  const matches = window.length === RULE.consecutive && window.every(isAnomalous)
  return matches && armed && !hasOpenAlert ? 'create' : 'none'
}

const alertTransitions: Record<AlertStatus, AlertStatus[]> = {
  new: ['confirmed', 'false_positive', 'cleared'],
  confirmed: ['cleared'],
  false_positive: [],
  cleared: [],
}

export function canTransitionAlert(from: AlertStatus, to: AlertStatus): boolean {
  return alertTransitions[from].includes(to)
}

export function isOpenAlert(status: AlertStatus): boolean {
  return status === 'new' || status === 'confirmed'
}

type StatusInput = { hasOpenAlert: boolean; ticksSinceSeen: number; latestLevel: number | null }

export function drainStatus({
  hasOpenAlert,
  ticksSinceSeen,
  latestLevel,
}: StatusInput): DrainStatus {
  if (hasOpenAlert) return 'obstructed'
  if (ticksSinceSeen >= OFFLINE_AFTER_TICKS) return 'offline'
  if (latestLevel !== null && latestLevel >= ATTENTION_LEVEL_MIN) return 'attention'
  return 'normal'
}
