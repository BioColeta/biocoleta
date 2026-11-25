import { isOpenAlert } from './rules.ts'
import type { Alert, DrainStatus, DrainView } from './types.ts'

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function minutesBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / 60000
}

export type LevelBucket = { hour: string; district: string; sum: number; count: number }

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

type SummaryInput = {
  drains: DrainView[]
  alerts: Alert[]
  hourly: LevelBucket[]
  district?: string
  now: Date
}

export function dashboardSummary({ drains, alerts, hourly, district, now }: SummaryInput) {
  const inScope = drains.filter((drain) => !district || drain.district === district)
  const ids = new Set(inScope.map((drain) => drain.id))
  const scoped = alerts.filter((alert) => ids.has(alert.drainId))
  const byStatus: Record<DrainStatus, number> = {
    normal: 0,
    attention: 0,
    obstructed: 0,
    offline: 0,
  }
  for (const drain of inScope) byStatus[drain.status] += 1

  const decided = scoped.filter((alert) => alert.decidedAt)
  const falsePositives = decided.filter((alert) => alert.status === 'false_positive')

  const alertsPerDay = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now)
    day.setDate(day.getDate() - (6 - index))
    const key = dayKey(day)
    return {
      day: key,
      alerts: scoped.filter((alert) => dayKey(new Date(alert.createdAt)) === key).length,
    }
  })

  const since = now.getTime() - 24 * 3600_000
  const levels = new Map<string, { sum: number; count: number }>()
  for (const bucket of hourly) {
    if (district && bucket.district !== district) continue
    if (Date.parse(bucket.hour) < since) continue
    const total = levels.get(bucket.hour) ?? { sum: 0, count: 0 }
    levels.set(bucket.hour, { sum: total.sum + bucket.sum, count: total.count + bucket.count })
  }
  const levelHistory = [...levels]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, total]) => ({ hour, level: Number((total.sum / total.count).toFixed(1)) }))

  const rank: Record<DrainStatus, number> = { obstructed: 0, offline: 1, attention: 2, normal: 3 }
  const attention = inScope
    .filter((drain) => drain.status !== 'normal')
    .sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        (b.lastReading?.waterLevel ?? 0) - (a.lastReading?.waterLevel ?? 0),
    )

  return {
    monitored: inScope.length,
    byStatus,
    awaitingDecision: scoped.filter((alert) => alert.status === 'new').length,
    openAlerts: scoped.filter((alert) => isOpenAlert(alert.status)).length,
    medianDecisionMinutes: median(
      decided.map((alert) => minutesBetween(alert.createdAt, alert.decidedAt!)),
    ),
    falsePositiveRate: decided.length ? falsePositives.length / decided.length : null,
    alertsPerDay,
    levelHistory,
    attention,
    districts: [...new Set(drains.map((drain) => drain.district))].sort(),
  }
}

export type DashboardSummary = ReturnType<typeof dashboardSummary>
