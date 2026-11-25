import type { Random } from '@/domain/random'
import { generateValues } from '@/domain/scenarios'
import { buildPayload, payloadSchema } from '@/domain/telemetry'
import type { Db } from '@/mocks/db'
import { ingest } from '@/mocks/services/telemetry'

export function runTick(db: Db, random: Random, now: Date) {
  if (!db.simulation.running) return
  db.tick += 1
  for (const drain of db.drains) {
    const scenario = db.simulation.scenarios[drain.id] ?? 'normal'
    const values = generateValues(scenario, random, db.simulation.manual[drain.id])
    if (!values) continue
    ingest(db, payloadSchema.parse(buildPayload(drain, values, now)), now)
  }
}
