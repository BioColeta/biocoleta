import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useState, type ReactNode, type Ref } from 'react'
import MapGL, { NavigationControl, type MapProps, type MapRef } from 'react-map-gl/maplibre'
import { useTheme } from '@/app/theme'
import { EmptyState } from '@/components/states'

setWorkerUrl(workerUrl)

const LOAD_TIMEOUT_MS = 10_000

const styles = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/positron',
}

const blankStyle = (color: string) => ({
  version: 8 as const,
  sources: {},
  layers: [{ id: 'background', type: 'background' as const, paint: { 'background-color': color } }],
})

type Props = MapProps & { ref?: Ref<MapRef>; children?: ReactNode; label: string }

export default function BaseMap({ children, label, onLoad, onError, ref, ...props }: Props) {
  const theme = useTheme((state) => state.theme)
  const [loaded, setLoaded] = useState(false)
  const [offline, setOffline] = useState(false)
  const [unsupported, setUnsupported] = useState(false)

  useEffect(() => {
    if (loaded) return
    const timer = setTimeout(() => setOffline(true), LOAD_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [loaded])

  if (unsupported) {
    return (
      <EmptyState
        title="Este navegador não consegue desenhar o mapa"
        description="Ative a aceleração gráfica (WebGL). As demais telas continuam funcionando."
      />
    )
  }

  return (
    <div className="relative size-full" role="region" aria-label={label}>
      {offline && (
        <p
          role="status"
          className="bg-card text-warning absolute top-2 left-2 z-10 max-w-[calc(100%-4rem)] rounded-lg border px-3 py-1.5 text-xs"
        >
          Mapa base indisponível. Os bueiros continuam visíveis.
        </p>
      )}
      <MapGL
        {...props}
        ref={ref}
        mapStyle={offline ? blankStyle(theme === 'dark' ? '#0d252b' : '#e4efef') : styles[theme]}
        attributionControl={{ compact: true }}
        onLoad={(event) => {
          setLoaded(true)
          onLoad?.(event)
        }}
        onError={(event) => {
          if (/webgl/i.test(event.error?.message ?? '')) setUnsupported(true)
          else if (!loaded) setOffline(true)
          onError?.(event)
        }}
      >
        <NavigationControl position="top-right" />
        {children}
      </MapGL>
    </div>
  )
}
