import { describe, expect, it } from 'vitest'
import {
  cleaningRanking,
  localFlowLps,
  rainProfile,
  simulateStorm,
  solveNetwork,
  type HydroNode,
} from './hydrology'

const node = (id: string, elevationM: number, downstream: string | null, extra = {}) =>
  ({
    id,
    elevationM,
    downstreamDrainId: downstream,
    catchmentAreaM2: 2000,
    runoffCoefficient: 0.8,
    capacityLps: 30,
    status: 'normal',
    ...extra,
  }) as HydroNode

const network = [
  node('outlet', 10, null),
  node('top', 30, 'middle', { status: 'obstructed' }),
  node('middle', 20, 'outlet'),
]

describe('rational method', () => {
  it('turns 50 mm/h over 2000 m² into about 22.2 L/s', () => {
    expect(localFlowLps(network[0], 50)).toBeCloseTo(22.22, 2)
  })
})

describe('solveNetwork', () => {
  it('cascades the excess downhill', () => {
    const flows = solveNetwork(network, 50)
    const top = flows.get('top')!
    expect(top.capacityLps).toBeCloseTo(6)
    expect(top.excessLps).toBeCloseTo(22.22 - 6, 2)
    const middle = flows.get('middle')!
    expect(middle.inflowLps).toBeCloseTo(middle.localLps + top.excessLps)
    expect(middle.band).toBe('overload')
    expect(flows.get('outlet')!.inflowLps).toBeCloseTo(22.22 + middle.excessLps, 2)
  })

  it('conserves water: local flow equals captured water plus outlet excess', () => {
    const flows = solveNetwork(network, 90)
    const values = [...flows.values()]
    const local = values.reduce((sum, flow) => sum + flow.localLps, 0)
    const captured = values.reduce((sum, f) => sum + Math.min(f.inflowLps, f.capacityLps), 0)
    expect(captured + flows.get('outlet')!.excessLps).toBeCloseTo(local)
  })

  it('never lowers any pressure when rain gets heavier', () => {
    const light = solveNetwork(network, 20)
    const heavy = solveNetwork(network, 60)
    for (const [id, flow] of heavy)
      expect(flow.pressure).toBeGreaterThanOrEqual(light.get(id)!.pressure)
  })

  it('has no pressure without rain', () => {
    for (const flow of solveNetwork(network, 0).values()) expect(flow.pressure).toBe(0)
  })
})

describe('storm', () => {
  it('rises to the chosen peak in five minute steps', () => {
    const profile = rainProfile(50, 60)
    expect(profile).toHaveLength(12)
    expect(Math.max(...profile)).toBe(50)
    expect(profile.at(-1)!).toBeLessThan(50)
  })

  it('accumulates excess over the event', () => {
    expect(simulateStorm(network, 90, 60).excessLiters).toBeGreaterThan(
      simulateStorm(network, 90, 30).excessLiters,
    )
  })

  it('ranks the cleaning gain without changing the real state', () => {
    const [best] = cleaningRanking(network, 60, 60)
    expect(best.drainId).toBe('top')
    expect(best.savedLiters).toBeGreaterThan(0)
    expect(best.pressureAfter).toBeLessThan(best.pressureBefore)
    expect(network.find((item) => item.id === 'top')!.status).toBe('obstructed')
  })
})
