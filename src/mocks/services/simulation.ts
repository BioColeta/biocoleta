import { z } from 'zod'
import { seededRandom } from '@/domain/random'
import { aiModeSchema, manualValuesSchema, scenarioSchema, simulationSchema } from '@/domain/types'
import type { Db } from '@/mocks/db'
import { findDrain, record } from './common'

export const simulationPatchSchema = z.object({
  running: z.boolean().optional(),
  tickMs: simulationSchema.shape.tickMs.optional(),
  speed: simulationSchema.shape.speed.optional(),
  aiMode: aiModeSchema.optional(),
  scenario: z
    .object({
      drainId: z.string(),
      scenario: scenarioSchema,
      manual: manualValuesSchema.optional(),
    })
    .optional(),
  preset: z.enum(['storm', 'calm']).optional(),
})

export type SimulationPatch = z.infer<typeof simulationPatchSchema>

const STORM_RAIN = 14
const STORM_OBSTRUCTIONS = 3

function applyPreset(db: Db, preset: 'storm' | 'calm', now: Date) {
  db.simulation.manual = {}
  db.simulation.scenarios = {}
  if (preset === 'calm') return
  const random = seededRandom(now.getTime())
  const shuffled = db.drains
    .map((drain) => ({ id: drain.id, order: random() }))
    .sort((a, b) => a.order - b.order)
  shuffled.slice(0, STORM_RAIN + STORM_OBSTRUCTIONS).forEach(({ id }, index) => {
    db.simulation.scenarios[id] = index < STORM_OBSTRUCTIONS ? 'obstruction' : 'heavy_rain'
  })
}

export function updateSimulation(db: Db, patch: SimulationPatch, now: Date) {
  const { scenario, preset, ...settings } = patch
  Object.assign(db.simulation, settings)
  if (preset) applyPreset(db, preset, now)
  if (scenario) {
    findDrain(db, scenario.drainId)
    const { scenarios, manual } = db.simulation
    delete manual[scenario.drainId]
    if (scenario.scenario === 'normal') delete scenarios[scenario.drainId]
    else scenarios[scenario.drainId] = scenario.scenario
    if (scenario.scenario === 'manual' && scenario.manual)
      manual[scenario.drainId] = scenario.manual
  }
  if (preset) {
    record(
      db,
      {
        type: 'simulation.preset',
        actor: 'operator',
        entityType: 'simulation',
        entityId: preset,
        details: {},
      },
      now,
    )
  }
  return db.simulation
}
