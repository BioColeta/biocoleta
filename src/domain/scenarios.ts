import { between, type Random } from './random.ts'
import type { ManualValues, Scenario } from './types.ts'

type Ranges = { level: [number, number]; flow: [number, number] }

const calm: Ranges = { level: [10, 40], flow: [1.5, 3.5] }

export const scenarioRanges: Record<Exclude<Scenario, 'sensor_offline' | 'manual'>, Ranges> = {
  normal: calm,
  tamper: calm,
  heavy_rain: { level: [60, 90], flow: [3, 8] },
  obstruction: { level: [78, 90], flow: [0, 0.04] },
  flash_flood: { level: [90, 100], flow: [0, 0.02] },
}

export function generateValues(
  scenario: Scenario,
  random: Random,
  manual?: ManualValues,
): ManualValues | null {
  if (scenario === 'sensor_offline') return null
  if (scenario === 'manual' && manual) return manual
  const ranges = scenarioRanges[scenario === 'manual' ? 'normal' : scenario]
  return {
    waterLevel: between(random, ...ranges.level, 1),
    waterFlow: between(random, ...ranges.flow),
    quality: between(random, 0.9, 0.99),
    tamper: scenario === 'tamper',
  }
}
