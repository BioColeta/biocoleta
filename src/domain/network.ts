export const MAX_LINK_METERS = 600

type Point = { id: string; lat: number; lng: number; elevationM: number }

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const x = radians(b.lng - a.lng) * Math.cos(radians((a.lat + b.lat) / 2))
  const y = radians(b.lat - a.lat)
  return Math.hypot(x, y) * 6_371_000
}

/**
 * Each drain drains into the closest strictly lower drain within reach. "Strictly lower" is what
 * guarantees the network has no cycles.
 */
export function buildDrainNetwork(
  points: Point[],
  maxMeters = MAX_LINK_METERS,
): Record<string, string | null> {
  return Object.fromEntries(
    points.map((point) => {
      const [closest] = points
        .filter((other) => other.elevationM < point.elevationM)
        .map((other) => ({ id: other.id, distance: distanceMeters(point, other) }))
        .filter((other) => other.distance <= maxMeters)
        .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id))
      return [point.id, closest?.id ?? null]
    }),
  )
}
