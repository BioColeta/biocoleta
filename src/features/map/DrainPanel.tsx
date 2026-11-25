import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useDevice, useDrain, useTelemetry } from '@/api/hooks'
import { QueryView } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { TelemetryChart } from '@/components/TelemetryChart'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDateTime, formatFlow, formatLevel } from '@/lib/format'
import { drainStatusInfo } from '@/lib/labels'

export function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      {items.map(([term, value]) => (
        <div key={term}>
          <dt className="text-muted-foreground text-xs">{term}</dt>
          <dd className="font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Telemetry({ drainId }: { drainId: string }) {
  const telemetry = useTelemetry(drainId)
  return (
    <QueryView query={telemetry}>
      {(readings) => <TelemetryChart readings={readings} height={220} />}
    </QueryView>
  )
}

function DeviceFacts({ deviceId }: { deviceId: string }) {
  const device = useDevice(deviceId)
  return (
    <QueryView query={device}>
      {(data) => (
        <>
          <Facts
            items={[
              ['Dispositivo', data.id],
              ['Bateria', `${data.battery}%`],
              ['Sinal', `${data.signalDbm} dBm`],
              ['Última comunicação', formatDateTime(data.lastSeenAt)],
            ]}
          />
          <Button asChild variant="outline" size="sm">
            <Link to="/app/devices/$deviceId" params={{ deviceId }}>
              Ver dispositivo
            </Link>
          </Button>
        </>
      )}
    </QueryView>
  )
}

export function DrainPanel({ drainId, onClose }: { drainId: string; onClose: () => void }) {
  const drain = useDrain(drainId)
  return (
    <Card className="relative flex flex-col gap-4" aria-label={`Detalhes de ${drainId}`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={onClose}
        aria-label="Fechar detalhes"
      >
        <X />
      </Button>
      <QueryView query={drain}>
        {(data) => (
          <>
            <div className="pr-10">
              <h2 className="text-lg font-semibold">{data.id}</h2>
              <p className="text-muted-foreground text-sm">
                {data.address} · {data.district}
              </p>
              <div className="mt-2">
                <StatusBadge {...drainStatusInfo[data.status]} />
              </div>
            </div>
            <Facts
              items={[
                ['Nível', formatLevel(data.lastReading?.waterLevel)],
                ['Fluxo', formatFlow(data.lastReading?.waterFlow)],
              ]}
            />
            {data.openAlertId && (
              <Button asChild>
                <Link to="/app/alerts/$alertId" params={{ alertId: data.openAlertId }}>
                  Abrir alerta {data.openAlertId}
                </Link>
              </Button>
            )}
            <Telemetry drainId={data.id} />
            <DeviceFacts deviceId={data.deviceId} />
          </>
        )}
      </QueryView>
    </Card>
  )
}
