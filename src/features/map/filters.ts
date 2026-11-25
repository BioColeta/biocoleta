import type { DrainStatus, DrainView } from '@/domain/types'

export type MapFilters = { status?: DrainStatus; district?: string; q?: string }

export function filterDrains(drains: DrainView[], { status, district, q }: MapFilters) {
  const term = q?.trim().toLowerCase()
  const inScope = drains.filter(
    (drain) =>
      (!district || drain.district === district) &&
      (!term || `${drain.id} ${drain.address}`.toLowerCase().includes(term)),
  )
  const counts: Record<DrainStatus, number> = {
    obstructed: 0,
    attention: 0,
    offline: 0,
    normal: 0,
  }
  for (const drain of inScope) counts[drain.status] += 1
  return {
    visible: status ? inScope.filter((drain) => drain.status === status) : inScope,
    counts,
  }
}

export function boundsOf(points: { lat: number; lng: number }[]): [number, number, number, number] {
  const lngs = points.map((point) => point.lng)
  const lats = points.map((point) => point.lat)
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
}
