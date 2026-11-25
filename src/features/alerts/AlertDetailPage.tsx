import { Link, useParams } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { useAlert, useTelemetry } from '@/api/hooks'
import { Page, PageHeader } from '@/components/page'
import { QueryView } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { TelemetryChart } from '@/components/TelemetryChart'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import type { AlertView } from '@/domain/types'
import { AlertAnalysisPanel } from '@/features/ai/AlertAnalysisPanel'
import { AlertWorkOrderPanel } from '@/features/work-orders/AlertWorkOrderPanel'
import { formatDateTime, formatFlow, formatLevel, formatTime } from '@/lib/format'
import { alertStatusInfo } from '@/lib/labels'
import { Decision } from './Decision'
import { timelineOf } from './timeline'

function Evidence({ alert }: { alert: AlertView }) {
  const { levelMin, flowMax, consecutive } = alert.evidence.thresholds
  return (
    <Card>
      <CardTitle>Evidência</CardTitle>
      <p className="text-muted-foreground mb-3 text-sm">
        Regra <code>{alert.ruleId}</code>: nível a partir de {levelMin}% e fluxo até{' '}
        {formatFlow(flowMax)} em {consecutive} leituras seguidas.
      </p>
      <ol className="grid gap-2 sm:grid-cols-2">
        {alert.evidence.readings.map((reading, index) => (
          <li key={reading.id} className="bg-background rounded-lg border p-3 text-sm">
            <p className="text-muted-foreground text-xs">
              {index + 1}ª leitura · {formatTime(reading.recordedAt)}
            </p>
            <p className="mt-1 font-medium">
              Nível {formatLevel(reading.waterLevel)} · Fluxo {formatFlow(reading.waterFlow)}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function Telemetry({ alert }: { alert: AlertView }) {
  const telemetry = useTelemetry(alert.drainId)
  return (
    <Card>
      <CardTitle>Telemetria recente</CardTitle>
      <QueryView query={telemetry}>
        {(readings) => (
          <TelemetryChart
            readings={readings}
            evidenceIds={alert.evidence.readings.map((reading) => reading.id)}
          />
        )}
      </QueryView>
    </Card>
  )
}

function Timeline({ alert }: { alert: AlertView }) {
  return (
    <Card>
      <CardTitle>Linha do tempo</CardTitle>
      <ol className="border-primary/40 ml-1 grid gap-4 border-l pl-4">
        {timelineOf(alert).map((step) => (
          <li key={step.title} className="relative text-sm">
            <span className="bg-primary absolute top-1.5 -left-[21px] size-2.5 rounded-full" />
            <strong className="block">{step.title}</strong>
            <span className="text-muted-foreground">{formatDateTime(step.at)}</span>
            {step.detail && <span className="text-muted-foreground block">{step.detail}</span>}
          </li>
        ))}
      </ol>
    </Card>
  )
}

export function AlertDetailPage() {
  const { alertId } = useParams({ from: '/app/alerts/$alertId' })
  const query = useAlert(alertId)
  return (
    <Page>
      <QueryView query={query}>
        {(alert) => (
          <>
            <PageHeader
              title={`${alert.id} · ${alert.drainId}`}
              description={`${alert.address} · ${alert.district}`}
              actions={
                <>
                  <StatusBadge {...alertStatusInfo[alert.status]} />
                  <Button asChild variant="outline" size="sm">
                    <Link to="/app/map" search={{ drain: alert.drainId }}>
                      <MapPin /> Ver no mapa
                    </Link>
                  </Button>
                </>
              }
            />
            <div className="grid gap-3 xl:grid-cols-[2fr_1fr]">
              <div className="grid min-w-0 content-start gap-3">
                {alert.status === 'new' && (
                  <Card className="border-danger/60">
                    <CardTitle>Sua decisão</CardTitle>
                    <Decision alertId={alert.id} />
                  </Card>
                )}
                {alert.status === 'cleared' && (
                  <p role="status" className="border-ok/40 bg-ok/10 rounded-xl border p-3 text-sm">
                    Encerrado automaticamente: a telemetria voltou ao normal.
                  </p>
                )}
                <Evidence alert={alert} />
                <Telemetry alert={alert} />
                <AlertAnalysisPanel alertId={alert.id} />
              </div>
              <div className="grid min-w-0 content-start gap-3">
                <AlertWorkOrderPanel alert={alert} />
                <Timeline alert={alert} />
              </div>
            </div>
          </>
        )}
      </QueryView>
    </Page>
  )
}
