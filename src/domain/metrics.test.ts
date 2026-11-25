import { describe, expect, it } from 'vitest'
import { dashboardSummary, median } from './metrics'
import type { Alert, DrainView } from './types'

const now = new Date('2026-11-25T12:00:00Z')

describe('median', () => {
  it('handles even, odd and empty lists', () => {
    expect(median([5, 1, 9])).toBe(5)
    expect(median([4, 2])).toBe(3)
    expect(median([])).toBeNull()
  })
})

describe('dashboardSummary', () => {
  const drains = [
    { id: 'A', district: 'Centro', status: 'obstructed', lastReading: null },
    { id: 'B', district: 'Sul', status: 'normal', lastReading: null },
  ] as DrainView[]
  const alerts = [
    {
      drainId: 'A',
      status: 'false_positive',
      createdAt: '2026-11-25T10:00:00Z',
      decidedAt: '2026-11-25T10:10:00Z',
    },
    { drainId: 'B', status: 'new', createdAt: '2026-11-25T11:00:00Z', decidedAt: null },
  ] as Alert[]

  it('restricts every indicator to the chosen district', () => {
    const summary = dashboardSummary({ drains, alerts, hourly: [], district: 'Centro', now })
    expect(summary.monitored).toBe(1)
    expect(summary.awaitingDecision).toBe(0)
    expect(summary.falsePositiveRate).toBe(1)
    expect(summary.medianDecisionMinutes).toBe(10)
    expect(summary.attention.map((drain) => drain.id)).toEqual(['A'])
  })
})
