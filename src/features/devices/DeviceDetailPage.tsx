import { Link, useParams } from '@tanstack/react-router'
import { ApiError } from '@/api/client'
import { useAlerts, useAudit, useDevice, useTelemetry } from '@/api/hooks'
import { Page, PageHeader } from '@/components/page'
import { EmptyState, QueryView } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { TelemetryChart } from '@/components/TelemetryChart'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { payloadFromReading } from '@/domain/telemetry'
import type { DeviceView } from '@/domain/types'
import { Facts } from '@/features/map/DrainPanel'
import { formatDateTime } from '@/lib/format'
import { alertStatusInfo, auditTypeLabel } from '@/lib/labels'
import { DeviceFlags } from './DeviceFlags'

function History({ device }: { device: DeviceView }) {
  const alerts = useAlerts()
  const audit = useAudit()
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardTitle>Alertas anteriores</CardTitle>
        <QueryView query={alerts}>
          {(data) => {
            const own = data.filter((alert) => alert.deviceId === device.id)
            if (own.length === 0) return <EmptyState title="Nenhum alerta neste dispositivo" />
            return (
              <ul className="divide-y">
                {own.map((alert) => (
                  <li key={alert.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                    <Link
                      to="/app/alerts/$alertId"
                      params={{ alertId: alert.id }}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {alert.id} · {formatDateTime(alert.createdAt)}
                    </Link>
                    <StatusBadge {...alertStatusInfo[alert.status]} />
                  </li>
                ))}
              </ul>
            )
          }}
        </QueryView>
      </Card>
      <Card>
        <CardTitle>Eventos</CardTitle>
        <QueryView query={audit}>
          {(data) => {
            const own = data
              .filter(
                (event) => event.entityId === device.id || event.details.drainId === device.drainId,
              )
              .slice(0, 15)
            if (own.length === 0) return <EmptyState title="Nenhum evento registrado" />
            return (
              <ul className="divide-y">
                {own.map((event) => (
                  <li key={event.id} className="py-2 text-sm">
                    {auditTypeLabel[event.type] ?? event.type}
                    <span className="text-muted-foreground block">
                      {event.entityId} · {formatDateTime(event.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )
          }}
        </QueryView>
      </Card>
    </div>
  )
}

function Readings({ device }: { device: DeviceView }) {
  const telemetry = useTelemetry(device.drainId)
  return (
    <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardTitle>Telemetria</CardTitle>
        <QueryView query={telemetry}>
          {(readings) => <TelemetryChart readings={readings} />}
        </QueryView>
      </Card>
      <Card>
        <CardTitle>Último payload</CardTitle>
        {device.lastReading ? (
          <pre
            className="bg-background max-h-72 overflow-auto rounded-lg border p-3 text-xs"
            tabIndex={0}
            aria-label="Último payload em JSON"
          >
            {JSON.stringify(payloadFromReading(device.drainId, device.lastReading), null, 2)}
          </pre>
        ) : (
          <EmptyState title="Nenhum envio ainda" />
        )}
      </Card>
    </div>
  )
}

export function DeviceDetailPage() {
  const { deviceId } = useParams({ from: '/app/devices/$deviceId' })
  const query = useDevice(deviceId)

  if (query.error instanceof ApiError && query.error.status === 404) {
    return (
      <EmptyState
        title="Dispositivo não encontrado"
        description={`Não existe dispositivo com o ID ${deviceId}.`}
        action={
          <Button asChild>
            <Link to="/app/devices">Ver todos</Link>
          </Button>
        }
      />
    )
  }

  return (
    <Page>
      <QueryView query={query}>
        {(device) => (
          <div className="grid gap-3">
            <PageHeader
              title={device.id}
              description={`${device.drainId} · ${device.district}`}
              actions={<DeviceFlags device={device} />}
            />
            <Card>
              <Facts
                items={[
                  ['Bateria', `${device.battery}%`],
                  ['Sinal', `${device.signalDbm} dBm`],
                  ['Firmware', device.firmware],
                  ['Última comunicação', formatDateTime(device.lastSeenAt)],
                ]}
              />
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/app/map" search={{ drain: device.drainId }}>
                  Ver no mapa
                </Link>
              </Button>
            </Card>
            <Readings device={device} />
            <History device={device} />
          </div>
        )}
      </QueryView>
    </Page>
  )
}
