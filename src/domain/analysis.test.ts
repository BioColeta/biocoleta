import { describe, expect, it } from 'vitest'
import { analyzeReadings } from './analysis'
import type { Reading } from './types'

const window = (waterLevel: number, waterFlow: number, quality = 0.95): Reading[] =>
  Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    deviceId: 'ESP32-DRAIN-0102',
    recordedAt: new Date(index * 1000).toISOString(),
    waterLevel,
    waterFlow,
    quality,
    tamperAlert: false,
  }))

describe('analyzeReadings', () => {
  it.each([
    ['obstruction', window(85, 0.01)],
    ['normal', window(20, 2.5)],
    ['sensor_fault', window(85, 0.01, 0.2)],
    ['inconclusive', window(85, 0.01).slice(0, 1)],
  ])('classifies a %s window', (expected, readings) => {
    expect(analyzeReadings(readings, 'v2').classification).toBe(expected)
  })

  it('returns the same result for the same window and prompt version', () => {
    expect(analyzeReadings(window(80, 0.2), 'v1')).toEqual(analyzeReadings(window(80, 0.2), 'v1'))
  })
})
