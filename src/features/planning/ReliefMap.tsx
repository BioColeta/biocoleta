import { ArrowUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Layer, Marker, Source, type MapRef } from 'react-map-gl/maplibre'
import BaseMap from '@/components/map/BaseMap'
import { Button } from '@/components/ui/button'
import type { NodeFlow } from '@/domain/hydrology'
import type { DrainView } from '@/domain/types'
import { DrainMarker } from '@/features/map/DrainMarker'
import { boundsOf } from '@/features/map/filters'
import { formatPercent } from '@/lib/format'
import { bandInfo } from './pressure'

const TILES = ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']
const ATTRIBUTION =
  '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Terrain Tiles: SRTM/GMTED2010 (USGS), ETOPO1 (NOAA)</a>'
const demSource = {
  type: 'raster-dem' as const,
  tiles: TILES,
  encoding: 'terrarium' as const,
  tileSize: 256,
  maxzoom: 14,
  attribution: ATTRIBUTION,
}

function linksOf(drains: DrainView[]) {
  const byId = new Map(drains.map((drain) => [drain.id, drain]))
  return drains.flatMap((drain) => {
    const next = drain.downstreamDrainId ? byId.get(drain.downstreamDrainId) : undefined
    return next ? [{ from: drain, to: next }] : []
  })
}

function bearing(from: DrainView, to: DrainView) {
  const x = (to.lng - from.lng) * Math.cos((from.lat * Math.PI) / 180)
  return (Math.atan2(x, to.lat - from.lat) * 180) / Math.PI
}

type Props = {
  drains: DrainView[]
  flows: Map<string, NodeFlow>
  selected: string | null
  onSelect: (id: string) => void
}

export function ReliefMap({ drains, flows, selected, onSelect }: Props) {
  const map = useRef<MapRef>(null)
  const [wants3d, setWants3d] = useState(true)
  const [reliefFailed, setReliefFailed] = useState(false)
  const [bounds] = useState(() => boundsOf(drains))
  const is3d = wants3d && !reliefFailed
  const links = linksOf(drains)

  useEffect(() => {
    map.current?.easeTo({ pitch: is3d ? 60 : 0, bearing: is3d ? -20 : 0 })
  }, [is3d])

  return (
    <div className="relative size-full">
      <BaseMap
        ref={map}
        label="Relevo e pressão da rede de drenagem"
        initialViewState={{ bounds, fitBoundsOptions: { padding: 40 } }}
        maxPitch={70}
        terrain={is3d ? { source: 'terrain', exaggeration: 2.5 } : undefined}
        onLoad={(event) => {
          if (is3d) event.target.easeTo({ pitch: 60, bearing: -20 })
        }}
        onError={(event) => {
          const source = (event as { sourceId?: string }).sourceId
          if (source === 'terrain' || source === 'shade') setReliefFailed(true)
        }}
      >
        {!reliefFailed && (
          <>
            <Source id="terrain" {...demSource} />
            <Source id="shade" {...demSource}>
              <Layer
                id="hillshade"
                type="hillshade"
                paint={{ 'hillshade-exaggeration': 0.6, 'hillshade-shadow-color': '#000000' }}
              />
            </Source>
          </>
        )}
        <Source
          id="links"
          type="geojson"
          data={{
            type: 'FeatureCollection',
            features: links.map(({ from, to }) => ({
              type: 'Feature',
              properties: { excess: flows.get(from.id)!.excessLps },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [from.lng, from.lat],
                  [to.lng, to.lat],
                ],
              },
            })),
          }}
        >
          <Layer
            id="link-lines"
            type="line"
            paint={{
              'line-color': ['case', ['>', ['get', 'excess'], 0], '#f48a83', '#38bdf8'],
              'line-width': ['case', ['>', ['get', 'excess'], 0], 4, 2],
              'line-opacity': 0.85,
            }}
          />
        </Source>
        {links.map(({ from, to }) => (
          <Marker
            key={`arrow-${from.id}`}
            longitude={from.lng + (to.lng - from.lng) * 0.6}
            latitude={from.lat + (to.lat - from.lat) * 0.6}
            rotation={bearing(from, to)}
            rotationAlignment="map"
          >
            <ArrowUp className="text-foreground pointer-events-none size-4" aria-hidden />
          </Marker>
        ))}
        {drains.map((drain) => {
          const flow = flows.get(drain.id)!
          const info = bandInfo[flow.band]
          return (
            <Marker
              key={drain.id}
              longitude={drain.lng}
              latitude={drain.lat}
              style={{ zIndex: flow.band === 'normal' ? 1 : 2 }}
            >
              <DrainMarker
                tone={info.tone}
                label={`${drain.id}, ${info.label}, pressão ${formatPercent(flow.pressure)}`}
                selected={selected === drain.id}
                onClick={() => onSelect(drain.id)}
              />
            </Marker>
          )
        })}
      </BaseMap>
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-3 left-3 z-10 shadow-lg"
        onClick={() => setWants3d(!wants3d)}
        disabled={reliefFailed}
      >
        {is3d ? 'Ver em 2D' : 'Ver em 3D'}
      </Button>
      {reliefFailed && (
        <p
          role="status"
          className="bg-card text-warning absolute top-14 left-3 z-10 max-w-xs rounded-lg border px-3 py-1.5 text-xs"
        >
          Relevo indisponível. Mapa em 2D; os cálculos continuam valendo.
        </p>
      )}
    </div>
  )
}
