import { describe, expect, it } from 'vitest'
import { csvCell, toCsv } from './csv'
import { filterEvents, reportOf } from './history'
import type { AuditEvent } from './types'

const now = new Date('2026-11-25T12:00:00Z')
const event = (type: string, hoursAgo: number, details: AuditEvent['details'] = {}) => {
  const created: AuditEvent = {
    id: hoursAgo,
    type,
    actor: 'operator',
    entityType: 'alert',
    entityId: 'ALT-0001',
    details: { drainId: 'BUEIRO-1', ...details },
    createdAt: new Date(now.getTime() - hoursAgo * 3600_000).toISOString(),
  }
  return created
}

const events = [
  event('alert.created', 1),
  event('alert.confirmed', 1, { minutesToDecision: 4 }),
  event('alert.false_positive', 48, { minutesToDecision: 20 }),
]

describe('history', () => {
  it('derives the report from the same filtered events as the table', () => {
    const recent = filterEvents(events, { period: '24h' }, now)
    expect(recent).toHaveLength(2)
    expect(reportOf(recent)).toMatchObject({ confirmed: 1, falsePositive: 0, medianMinutes: 4 })
    expect(reportOf(filterEvents(events, { period: 'all' }, now)).falsePositive).toBe(1)
  })

  it('filters by type and by drain', () => {
    expect(filterEvents(events, { type: 'alert.created' }, now)).toHaveLength(1)
    expect(filterEvents(events, { entity: 'bueiro-9' }, now)).toHaveLength(0)
  })
})

describe('csv', () => {
  it.each(['=1+1', '+55', '-cmd', '@import'])('neutralizes the formula-like text %s', (text) => {
    expect(csvCell(text)).toBe(`'${text}`)
  })

  it('keeps numbers and quotes separators', () => {
    expect(csvCell(-3)).toBe('-3')
    expect(toCsv(['a'], [['x,"y"']])).toBe('a\r\n"x,""y"""')
  })
})
