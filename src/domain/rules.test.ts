import { describe, expect, it } from 'vitest'
import { canTransitionAlert, drainStatus, evaluateDetection } from './rules'

const blocked = { waterLevel: 80, waterFlow: 0.01 }
const normal = { waterLevel: 20, waterFlow: 2.5 }
const idle = { hasOpenAlert: false, armed: true }

describe('evaluateDetection', () => {
  it('creates an alert after two consecutive anomalous readings', () => {
    expect(evaluateDetection({ ...idle, readings: [blocked, blocked] })).toBe('create')
  })

  it('accepts the exact thresholds', () => {
    const edge = { waterLevel: 75, waterFlow: 0.05 }
    expect(evaluateDetection({ ...idle, readings: [edge, edge] })).toBe('create')
  })

  it.each([
    ['a single anomalous reading', [blocked]],
    ['an anomalous reading after a normal one', [normal, blocked]],
    ['high level with flow above the limit', [blocked, { waterLevel: 90, waterFlow: 0.06 }]],
  ])('does not create an alert for %s', (_, readings) => {
    expect(evaluateDetection({ ...idle, readings })).not.toBe('create')
  })

  it('keeps a single open alert per device', () => {
    const input = { readings: [blocked, blocked], hasOpenAlert: true, armed: true }
    expect(evaluateDetection(input)).toBe('none')
  })

  it('stays quiet after a false positive until a normal reading rearms it', () => {
    const disarmed = { hasOpenAlert: false, armed: false }
    expect(evaluateDetection({ ...disarmed, readings: [blocked, blocked] })).toBe('none')
    expect(evaluateDetection({ ...disarmed, readings: [blocked, normal] })).toBe('rearm')
  })

  it('clears an open alert when the reading leaves the rule', () => {
    const input = { readings: [blocked, normal], hasOpenAlert: true, armed: true }
    expect(evaluateDetection(input)).toBe('clear')
  })
})

describe('canTransitionAlert', () => {
  it('only allows decisions on new alerts', () => {
    expect(canTransitionAlert('new', 'confirmed')).toBe(true)
    expect(canTransitionAlert('confirmed', 'false_positive')).toBe(false)
    expect(canTransitionAlert('confirmed', 'cleared')).toBe(true)
    expect(canTransitionAlert('cleared', 'confirmed')).toBe(false)
  })
})

describe('drainStatus', () => {
  it.each([
    [{ hasOpenAlert: true, ticksSinceSeen: 9, latestLevel: 90 }, 'obstructed'],
    [{ hasOpenAlert: false, ticksSinceSeen: 3, latestLevel: 90 }, 'offline'],
    [{ hasOpenAlert: false, ticksSinceSeen: 2, latestLevel: 60 }, 'attention'],
    [{ hasOpenAlert: false, ticksSinceSeen: 0, latestLevel: 59 }, 'normal'],
  ])('follows the precedence for %o', (input, expected) => {
    expect(drainStatus(input)).toBe(expected)
  })
})
