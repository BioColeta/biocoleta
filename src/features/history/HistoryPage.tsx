import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { Download } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAudit } from '@/api/hooks'
import { DataTable } from '@/components/data-table'
import { KpiCard, Page, PageHeader } from '@/components/page'
import { EmptyState, QueryView } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/field'
import { toCsv } from '@/domain/csv'
import { filterEvents, reportOf, type HistoryFilters } from '@/domain/history'
import type { AuditEvent } from '@/domain/types'
import { axisTick, chartTooltip } from '@/lib/chart'
import { formatDateTime, formatMinutes } from '@/lib/format'
import { actorLabel, auditTypeLabel, workOrderStatusLabel } from '@/lib/labels'

const typeName = (type: string) => auditTypeLabel[type] ?? type

function detailText(event: AuditEvent) {
  const { by, from, to, promptVersion, minutesToDecision } = event.details
  const status = (value: unknown) =>
    workOrderStatusLabel[value as keyof typeof workOrderStatusLabel] ?? String(value)
  return [
    from && to ? `${status(from)} → ${status(to)}` : null,
    by ? `por ${by}` : null,
    minutesToDecision !== undefined ? `decisão em ${minutesToDecision} min` : null,
    promptVersion ? `prompt ${promptVersion}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

function EntityLink({ event }: { event: AuditEvent }) {
  const className = 'text-primary underline-offset-4 hover:underline'
  if (event.entityType === 'alert') {
    return (
      <Link to="/app/alerts/$alertId" params={{ alertId: event.entityId }} className={className}>
        {event.entityId}
      </Link>
    )
  }
  if (event.entityType === 'device') {
    return (
      <Link to="/app/devices/$deviceId" params={{ deviceId: event.entityId }} className={className}>
        {event.entityId}
      </Link>
    )
  }
  if (event.entityType === 'work_order' || event.entityType === 'prompt') {
    return (
      <Link
        to={event.entityType === 'prompt' ? '/app/settings' : '/app/work-orders'}
        className={className}
      >
        {event.entityId}
      </Link>
    )
  }
  return event.entityId
}

const column = createColumnHelper<AuditEvent>()
const columns = [
  column.accessor('createdAt', {
    header: 'Quando',
    cell: (info) => formatDateTime(info.getValue()),
  }),
  column.accessor((event) => typeName(event.type), { id: 'type', header: 'Evento' }),
  column.accessor((event) => actorLabel[event.actor], { id: 'actor', header: 'Ator' }),
  column.accessor('entityId', {
    header: 'Origem',
    cell: (info) => <EntityLink event={info.row.original} />,
  }),
  column.accessor((event) => String(event.details.drainId ?? ''), {
    id: 'drain',
    header: 'Bueiro',
  }),
  column.accessor(detailText, { id: 'details', header: 'Detalhes' }),
]

function download(events: AuditEvent[]) {
  const csv = toCsv(
    ['quando', 'evento', 'ator', 'origem', 'bueiro', 'detalhes'],
    events.map((event) => [
      event.createdAt,
      typeName(event.type),
      actorLabel[event.actor],
      event.entityId,
      String(event.details.drainId ?? ''),
      detailText(event),
    ]),
  )
  // The byte order mark makes spreadsheets read the accents correctly.
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'biocoleta-historico.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function SimpleBars({
  title,
  data,
  category,
}: {
  title: string
  data: { total: number }[]
  category: string
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {data.every((item) => item.total === 0) ? (
        <EmptyState title="Sem dados no recorte" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <XAxis type="number" allowDecimals={false} tick={axisTick} />
            <YAxis type="category" dataKey={category} width={100} tick={axisTick} />
            <Tooltip {...chartTooltip} />
            <Bar dataKey="total" name="Total" fill="var(--primary)" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

function History({ events }: { events: AuditEvent[] }) {
  const search = useSearch({ from: '/app/history' })
  const navigate = useNavigate({ from: '/app/history' })
  const update = (patch: HistoryFilters) =>
    void navigate({ search: (current) => ({ ...current, ...patch }), replace: true })
  const filtered = filterEvents(events, search, new Date())
  const report = reportOf(filtered)
  const types = [...new Set(events.map((event) => event.type))].sort()

  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex flex-wrap gap-2">
        <Select
          aria-label="Período"
          className="w-40"
          value={search.period ?? '7d'}
          onChange={(e) => update({ period: e.target.value as HistoryFilters['period'] })}
        >
          <option value="24h">Últimas 24h</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="all">Todo o período</option>
        </Select>
        <Select
          aria-label="Tipo de evento"
          className="w-64 max-w-full"
          value={search.type ?? ''}
          onChange={(e) => update({ type: e.target.value || undefined })}
        >
          <option value="">Todos os eventos</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {typeName(type)}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Ator"
          className="w-44"
          value={search.actor ?? ''}
          onChange={(e) =>
            update({ actor: (e.target.value || undefined) as HistoryFilters['actor'] })
          }
        >
          <option value="">Todos os atores</option>
          {Object.entries(actorLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input
          aria-label="Origem ou bueiro"
          placeholder="ID da origem ou bueiro"
          className="w-56 max-w-full"
          value={search.entity ?? ''}
          onChange={(e) => update({ entity: e.target.value || undefined })}
        />
        <Button
          variant="outline"
          className="ml-auto"
          onClick={() => download(filtered)}
          disabled={filtered.length === 0}
        >
          <Download /> Exportar CSV
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Obstruções confirmadas" value={report.confirmed} />
        <KpiCard label="Falsos positivos" value={report.falsePositive} />
        <KpiCard label="Tempo mediano até a decisão" value={formatMinutes(report.medianMinutes)} />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <SimpleBars
          title="Decisões"
          category="label"
          data={
            [
              { label: 'Confirmados', total: report.confirmed },
              { label: 'Falso positivo', total: report.falsePositive },
            ] as { label: string; total: number }[]
          }
        />
        <SimpleBars title="Tempo até a decisão" category="label" data={report.timeToDecision} />
        <SimpleBars title="Bueiros com mais alertas" category="drain" data={report.topDrains} />
      </div>
      <DataTable label="Eventos de auditoria" columns={columns} data={filtered} pageSize={15} />
    </div>
  )
}

export function HistoryPage() {
  const audit = useAudit()
  return (
    <Page>
      <PageHeader
        title="Histórico"
        description="O que aconteceu, quem fez e quando. Os registros são somente leitura."
      />
      <QueryView query={audit}>{(events) => <History events={events} />}</QueryView>
    </Page>
  )
}
