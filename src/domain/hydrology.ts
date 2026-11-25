import type { DrainStatus, Terrain } from './types.ts'

/** Share of capacity assumed lost, by drain status. Demo assumptions, not measurements. */
export const OBSTRUCTION_FACTOR: Record<DrainStatus, number> = {
  obstructed: 0.8,
  attention: 0.3,
  normal: 0,
  offline: 0,
}
export const PRESSURE_LIMITS = { attention: 0.7, overload: 1 }
export const RAIN_PRESETS = [
  { label: 'Fraca', intensity: 5 },
  { label: 'Moderada', intensity: 20 },
  { label: 'Forte', intensity: 50 },
  { label: 'Extrema', intensity: 100 },
]
export const STEP_MINUTES = 5
const PEAK_AT = 0.4

export type HydroNode = Terrain & { id: string; status: DrainStatus }
export type Band = 'normal' | 'attention' | 'overload'

export type NodeFlow = {
  localLps: number
  inflowLps: number
  capacityLps: number
  excessLps: number
  pressure: number
  band: Band
  uncertain: boolean
}

/** Rational method: 1 mm of rain over 1 m² is 1 litre. */
export function localFlowLps(node: Terrain, intensityMmH: number): number {
  return (node.runoffCoefficient * intensityMmH * node.catchmentAreaM2) / 3600
}

export function bandOf(pressure: number): Band {
  if (pressure > PRESSURE_LIMITS.overload) return 'overload'
  return pressure >= PRESSURE_LIMITS.attention ? 'attention' : 'normal'
}

export function solveNetwork(nodes: HydroNode[], intensityMmH: number): Map<string, NodeFlow> {
  const upstream = new Map<string, number>()
  const flows = new Map<string, NodeFlow>()
  // Highest first, so every drain has received its upstream excess before it is solved.
  for (const node of [...nodes].sort((a, b) => b.elevationM - a.elevationM)) {
    const localLps = localFlowLps(node, intensityMmH)
    const inflowLps = localLps + (upstream.get(node.id) ?? 0)
    const capacityLps = node.capacityLps * (1 - OBSTRUCTION_FACTOR[node.status])
    const excessLps = Math.max(0, inflowLps - capacityLps)
    const pressure = inflowLps / capacityLps
    if (node.downstreamDrainId) {
      upstream.set(node.downstreamDrainId, (upstream.get(node.downstreamDrainId) ?? 0) + excessLps)
    }
    flows.set(node.id, {
      localLps,
      inflowLps,
      capacityLps,
      excessLps,
      pressure,
      band: bandOf(pressure),
      uncertain: node.status === 'offline',
    })
  }
  return flows
}

/** Rain that rises to the chosen peak and then recedes, one intensity per step. */
export function rainProfile(peakMmH: number, durationMinutes: number): number[] {
  const steps = Math.max(1, Math.round(durationMinutes / STEP_MINUTES))
  const peak = Math.floor(steps * PEAK_AT)
  return Array.from({ length: steps }, (_, step) => {
    const share = step <= peak ? (step + 1) / (peak + 1) : (steps - step) / (steps - peak)
    return peakMmH * share
  })
}

export function simulateStorm(nodes: HydroNode[], peakMmH: number, durationMinutes: number) {
  const steps = rainProfile(peakMmH, durationMinutes).map((intensity, index) => {
    const flows = solveNetwork(nodes, intensity)
    const values = [...flows.values()]
    // Excess only leaves the network at outlets; elsewhere the next drain still gets a chance.
    const outletExcessLps = nodes
      .filter((node) => !node.downstreamDrainId)
      .reduce((sum, node) => sum + flows.get(node.id)!.excessLps, 0)
    return {
      minute: (index + 1) * STEP_MINUTES,
      intensity,
      flows,
      outletExcessLps,
      overloaded: values.filter((flow) => flow.band === 'overload').length,
    }
  })
  const peakIndex = steps.reduce(
    (best, step, index) => (step.intensity > steps[best].intensity ? index : best),
    0,
  )
  const excessLiters = steps.reduce(
    (sum, step) => sum + step.outletExcessLps * STEP_MINUTES * 60,
    0,
  )
  return { steps, peakIndex, excessLiters }
}

export function cleaningRanking(nodes: HydroNode[], peakMmH: number, durationMinutes: number) {
  const base = simulateStorm(nodes, peakMmH, durationMinutes)
  const basePeak = base.steps[base.peakIndex]
  return nodes
    .filter((node) => OBSTRUCTION_FACTOR[node.status] > 0)
    .map((node) => {
      const cleaned = nodes.map((item) =>
        item.id === node.id ? { ...item, status: 'normal' as const } : item,
      )
      const storm = simulateStorm(cleaned, peakMmH, durationMinutes)
      const peak = storm.steps[storm.peakIndex]
      return {
        drainId: node.id,
        savedLiters: base.excessLiters - storm.excessLiters,
        avoidedOverloads: basePeak.overloaded - peak.overloaded,
        pressureBefore: basePeak.flows.get(node.id)!.pressure,
        pressureAfter: peak.flows.get(node.id)!.pressure,
      }
    })
    .sort(
      (a, b) =>
        b.savedLiters - a.savedLiters ||
        b.avoidedOverloads - a.avoidedOverloads ||
        b.pressureBefore - b.pressureAfter - (a.pressureBefore - a.pressureAfter),
    )
}
