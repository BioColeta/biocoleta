import { useMemo, useState, useEffect } from 'react'
import { Marker, useMap } from 'react-map-gl/maplibre'
import Supercluster from 'supercluster'
import type { DrainView } from '@/domain/types'
import { drainStatusInfo } from '@/lib/labels'
import { DrainMarker } from './DrainMarker'

const MAX_CLUSTER_ZOOM = 14

type Point = { id: string; obstructed: number }

type Props = {
  drains: DrainView[]
  selected?: string
  onSelect: (id: string) => void
}

export function ClusteredMarkers({ drains, selected, onSelect }: Props) {
  const { current: map } = useMap()
  const [zoom, setZoom] = useState(() => Math.floor(map?.getZoom() ?? 14))

  useEffect(() => {
    if (!map) return
    const update = () => setZoom(Math.floor(map.getZoom()))
    update()
    map.on('zoomend', update)
    return () => void map.off('zoomend', update)
  }, [map])

  const index = useMemo(() => {
    const cluster = new Supercluster<Point, Point>({
      radius: 42,
      maxZoom: MAX_CLUSTER_ZOOM,
      map: (point) => ({ ...point }),
      reduce: (total, point) => {
        total.obstructed += point.obstructed
      },
    })
    cluster.load(
      drains.map((drain) => ({
        type: 'Feature',
        properties: { id: drain.id, obstructed: drain.status === 'obstructed' ? 1 : 0 },
        geometry: { type: 'Point', coordinates: [drain.lng, drain.lat] },
      })),
    )
    return cluster
  }, [drains])

  const byId = new Map(drains.map((drain) => [drain.id, drain]))

  return index.getClusters([-180, -85, 180, 85], zoom).map((feature) => {
    const [lng, lat] = feature.geometry.coordinates
    if ('cluster' in feature.properties) {
      const { cluster_id: id, point_count: count, obstructed } = feature.properties
      return (
        <Marker key={`cluster-${id}`} longitude={lng} latitude={lat}>
          <button
            type="button"
            className={`bg-card grid size-11 place-items-center rounded-full border-4 text-sm font-semibold shadow-lg ${obstructed ? 'border-danger' : 'border-primary'}`}
            aria-label={`Grupo com ${count} bueiros, ${obstructed} obstruídos. Aproximar.`}
            onClick={() =>
              map?.easeTo({
                center: [lng, lat],
                zoom: index.getClusterExpansionZoom(id),
              })
            }
          >
            {count}
          </button>
        </Marker>
      )
    }
    const drain = byId.get(feature.properties.id)
    if (!drain) return null
    const info = drainStatusInfo[drain.status]
    return (
      <Marker
        key={drain.id}
        longitude={lng}
        latitude={lat}
        style={{ zIndex: drain.id === selected ? 3 : drain.status === 'normal' ? 1 : 2 }}
      >
        <DrainMarker
          tone={info.tone}
          label={`${drain.id}, ${info.label}`}
          selected={drain.id === selected}
          onClick={() => onSelect(drain.id)}
        />
      </Marker>
    )
  })
}
