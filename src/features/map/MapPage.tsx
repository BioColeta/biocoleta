import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { useDrains } from '@/api/hooks'
import BaseMap from '@/components/map/BaseMap'
import { Page, PageHeader } from '@/components/page'
import { QueryView } from '@/components/states'
import { toneIcons } from '@/components/status-badge'
import { Input, Select } from '@/components/ui/field'
import { drainStatusSchema, type DrainView } from '@/domain/types'
import { drainStatusInfo } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { ClusteredMarkers } from './ClusteredMarkers'
import { DrainPanel } from './DrainPanel'
import { boundsOf, filterDrains, type MapFilters } from './filters'

const SELECTED_ZOOM = 16
const toneText = {
  ok: 'text-ok',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-neutral',
}

function MapView({ drains }: { drains: DrainView[] }) {
  const search = useSearch({ from: '/app/map' })
  const navigate = useNavigate({ from: '/app/map' })
  const map = useRef<MapRef>(null)
  const [ready, setReady] = useState(false)
  const { visible, counts } = filterDrains(drains, search)
  const districts = [...new Set(drains.map((drain) => drain.district))].sort()
  const [initialBounds] = useState(() => boundsOf(drains))

  const update = (patch: MapFilters & { drain?: string }) =>
    void navigate({ search: (current) => ({ ...current, ...patch }), replace: true })

  const target = drains.find((drain) => drain.id === search.drain)
  const lat = target?.lat
  const lng = target?.lng

  useEffect(() => {
    if (!ready || lat === undefined || lng === undefined) return
    const current = map.current
    current?.easeTo({
      center: [lng, lat],
      zoom: Math.max(current.getZoom(), SELECTED_ZOOM),
    })
  }, [ready, lat, lng])

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Input
          type="search"
          aria-label="Buscar bueiro"
          placeholder="Buscar por ID ou endereço"
          className="w-64 max-w-full"
          value={search.q ?? ''}
          onChange={(event) => update({ q: event.target.value || undefined })}
        />
        <Select
          aria-label="Filtrar por setor"
          className="w-48"
          value={search.district ?? ''}
          onChange={(event) => update({ district: event.target.value || undefined })}
        >
          <option value="">Todos os setores</option>
          {districts.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </Select>
      </div>
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filtro por status"
      >
        {drainStatusSchema.options.map((status) => {
          const info = drainStatusInfo[status]
          const Icon = toneIcons[info.tone]
          const active = search.status === status
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => update({ status: active ? undefined : status })}
              className={cn(
                'bg-card flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
                active && 'border-primary bg-muted',
              )}
            >
              <Icon className={`size-4 ${toneText[info.tone]}`} aria-hidden />
              {info.label}
              <strong className="tabular-nums">{counts[status]}</strong>
            </button>
          )
        })}
        <span className="text-muted-foreground text-sm" role="status">
          Exibindo {visible.length} de {drains.length}
        </span>
      </div>
      <div className={cn('grid gap-3', search.drain && 'xl:grid-cols-[1fr_24rem]')}>
        <div className="h-[65dvh] min-h-96 min-w-0 overflow-hidden rounded-xl border">
          <BaseMap
            ref={map}
            label="Mapa dos bueiros monitorados"
            initialViewState={{ bounds: initialBounds, fitBoundsOptions: { padding: 48 } }}
            onLoad={() => setReady(true)}
          >
            <ClusteredMarkers
              drains={visible}
              selected={search.drain}
              onSelect={(drain) => update({ drain })}
            />
          </BaseMap>
        </div>
        {search.drain && (
          <DrainPanel drainId={search.drain} onClose={() => update({ drain: undefined })} />
        )}
      </div>
    </div>
  )
}

export function MapPage() {
  const drains = useDrains()
  return (
    <Page>
      <PageHeader title="Mapa operacional" description="Situação de cada bueiro em tempo real." />
      <QueryView query={drains}>{(data) => <MapView drains={data} />}</QueryView>
    </Page>
  )
}
