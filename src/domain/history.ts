import { median } from './metrics.ts'
import type { AuditEvent } from './types.ts'

export type HistoryFilters = {
  period?: '24h' | '7d' | 'all'
  type?: string
  actor?: AuditEvent['actor']
  entity?: string
}

const periodHours = { '24h': 24, '7d': 24 * 7 }

export function filterEvents(events: AuditEvent[], filters: HistoryFilters, now: Date) {
  const { period = '7d', type, actor, entity } = filters
  const since = period === 'all' ? 0 : now.getTime() - periodHours[period] * 3600_000
  const term = entity?.trim().toLowerCase()
  return events.filter(
    (event) =>
      Date.parse(event.createdAt) >= since &&
      (!type || event.type === type) &&
      (!actor || event.actor === actor) &&
      (!term || `${event.entityId} ${event.details.drainId ?? ''}`.toLowerCase().includes(term)),
  )
}

const buckets = [
  { label: 'até 5 min', max: 5 },
  { label: '6 a 15 min', max: 15 },
  { label: '16 a 30 min', max: 30 },
  { label: 'mais de 30 min', max: Infinity },
]

export function reportOf(events: AuditEvent[]) {
  const count = (type: string) => events.filter((event) => event.type === type).length
  const minutes = events
    .map((event) => event.details.minutesToDecision)
    .filter((value): value is number => typeof value === 'number')

  const timeToDecision = buckets.map((bucket, index) => ({
    label: bucket.label,
    total: minutes.filter(
      (value) => value <= bucket.max && value > (index ? buckets[index - 1].max : -Infinity),
    ).length,
  }))

  const perDrain = new Map<string, number>()
  for (const event of events) {
    if (event.type !== 'alert.created') continue
    const drain = String(event.details.drainId)
    perDrain.set(drain, (perDrain.get(drain) ?? 0) + 1)
  }

  return {
    confirmed: count('alert.confirmed'),
    falsePositive: count('alert.false_positive'),
    medianMinutes: median(minutes),
    timeToDecision,
    topDrains: [...perDrain]
      .map(([drain, total]) => ({ drain, total }))
      .sort((a, b) => b.total - a.total || a.drain.localeCompare(b.drain))
      .slice(0, 5),
  }
}
