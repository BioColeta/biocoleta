import { describe, expect, it } from 'vitest'
import { buildDrainNetwork, distanceMeters, MAX_LINK_METERS } from '@/domain/network'
import { terrariumElevation } from '@/domain/terrarium'
import locations from '@/mocks/data/drain-locations.json'
import terrain from '@/mocks/data/terrain.json'

const drains = locations.map((location) => ({
  ...location,
  ...terrain[location.id as keyof typeof terrain],
}))
const byId = new Map(drains.map((drain) => [drain.id, drain]))

describe('terrain data', () => {
  it('decodes terrarium pixels', () => {
    expect(terrariumElevation(128, 0, 0)).toBe(0)
    expect(terrariumElevation(131, 32, 128)).toBe(800.5)
  })

  it('covers every drain with plausible values', () => {
    for (const drain of drains) {
      expect(drain.elevationM).toBeGreaterThan(600)
      expect(drain.elevationM).toBeLessThan(900)
      expect(drain.catchmentAreaM2).toBeGreaterThanOrEqual(500)
      expect(drain.capacityLps).toBeGreaterThanOrEqual(20)
    }
  })

  it('only links downhill and within reach, so every path ends at an outlet', () => {
    for (const drain of drains) {
      if (!drain.downstreamDrainId) continue
      const next = byId.get(drain.downstreamDrainId)!
      expect(next.elevationM).toBeLessThan(drain.elevationM)
      expect(distanceMeters(drain, next)).toBeLessThanOrEqual(MAX_LINK_METERS)
    }
  })

  it('matches what the network builder produces for these elevations', () => {
    const rebuilt = buildDrainNetwork(drains)
    for (const drain of drains) expect(drain.downstreamDrainId).toBe(rebuilt[drain.id])
  })
})
