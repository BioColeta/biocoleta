import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAudit, useDrains, useSummary } from '@/api/hooks'
import { KpiCard, Page, PageHeader } from '@/components/page'
import { EmptyState, QueryView } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/field'
import type { DashboardSummary } from '@/domain/metrics'
import { drainStatusSchema } from '@/domain/types'
import { axisTick, chartTooltip } from '@/lib/chart'
import { formatDateTime, formatLevel, formatMinutes, formatPercent } from '@/lib/format'
import { auditTypeLabel, drainStatusInfo } from '@/lib/labels'

const toneColor = {
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  neutral: 'var(--neutral)',
  ok: 'var(--ok)',
}

function Indicators({ data, district }: { data: DashboardSummary; district?: string }) {
  const tiles = [
    { label: 'Bueiros monitorados', value: data.monitored, to: '/app/map', search: {} },
    {
      label: 'Obstruídos',
      value: data.byStatus.obstructed,
      to: '/app/map',
      search: { status: 'obstructed' },
    },
    {
      label: 'Em atenção',
      value: data.byStatus.attention,
      to: '/app/map',
      search: { status: 'attention' },
    },
    {
      label: 'Offline',
      value: data.byStatus.offline,
      to: '/app/devices',
      search: { filter: 'offline' },
    },
    {
      label: 'Aguardando decisão',
      value: data.awaitingDecision,
      to: '/app/alerts',
      search: { tab: 'new' },
    },
    {
      label: 'Tempo mediano até a decisão',
      value: formatMinutes(data.medianDecisionMinutes),
      to: '/app/history',
      search: { period: 'all' },
    },
    {
      label: 'Taxa de falso positivo',
      value: formatPercent(data.falsePositiveRate),
      to: '/app/history',
      search: { period: 'all', type: 'alert.false_positive' },
    },
  ] as const
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-7">
      {tiles.map((tile) => (
        <li key={tile.label}>
          <Link
            to={tile.to}
            search={
              // The district only filters the screens that understand it.
              tile.to === '/app/history' ? tile.search : { ...tile.search, district }
            }
            className="block h-full rounded-xl transition-transform hover:-translate-y-0.5"
          >
            <KpiCard label={tile.label} value={tile.value} />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Charts({ data }: { data: DashboardSummary }) {
  const statuses = drainStatusSchema.options.map((status) => ({
    status,
    name: drainStatusInfo[status].label,
    total: data.byStatus[status],
  }))
  const hourLabel = (hour: string) => `${new Date(hour).getHours()}h`
  const dayLabel = (day: string) => day.slice(8) + '/' + day.slice(5, 7)
  return (
    <div className="grid gap-3 xl:grid-cols-3">
      <Card className="xl:col-span-3">
        <CardTitle>Nível médio nas últimas 24h</CardTitle>
        {data.levelHistory.length === 0 ? (
          <EmptyState title="Sem leituras nas últimas 24h" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.levelHistory} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={hourLabel} tick={axisTick} />
              <YAxis unit="%" tick={axisTick} />
              <Tooltip {...chartTooltip} labelFormatter={(hour) => formatDateTime(String(hour))} />
              <Line
                dataKey="level"
                name="Nível médio (%)"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
      <Card className="xl:col-span-2">
        <CardTitle>Alertas por dia (7 dias)</CardTitle>
        {data.alertsPerDay.every((day) => day.alerts === 0) ? (
          <EmptyState title="Nenhum alerta no período" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.alertsPerDay} margin={{ left: -28 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={dayLabel} tick={axisTick} />
              <YAxis allowDecimals={false} tick={axisTick} />
              <Tooltip {...chartTooltip} labelFormatter={(day) => dayLabel(String(day))} />
              <Bar dataKey="alerts" name="Alertas" fill="var(--primary)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
      <Card>
        <CardTitle>Distribuição por status</CardTitle>
        {data.monitored === 0 ? (
          <EmptyState title="Nenhum bueiro no filtro" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statuses} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" allowDecimals={false} tick={axisTick} />
              <YAxis type="category" dataKey="name" width={70} tick={axisTick} />
              <Tooltip {...chartTooltip} />
              <Bar dataKey="total" name="Bueiros" radius={4}>
                {statuses.map((item) => (
                  <Cell key={item.status} fill={toneColor[drainStatusInfo[item.status].tone]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}

function Attention({ data }: { data: DashboardSummary }) {
  return (
    <Card>
      <CardTitle>Precisa de atenção</CardTitle>
      {data.attention.length === 0 ? (
        <EmptyState title="Tudo normal por aqui" />
      ) : (
        <ul className="max-h-96 divide-y overflow-y-auto" tabIndex={0} aria-label="Bueiros">
          {data.attention.map((drain) => (
            <li key={drain.id}>
              <Link
                to="/app/map"
                search={{ drain: drain.id }}
                className="hover:bg-muted flex flex-wrap items-center justify-between gap-2 rounded-md p-2.5 text-sm"
              >
                <span>
                  <strong>{drain.id}</strong>
                  <span className="text-muted-foreground block">
                    {drain.district} · nível {formatLevel(drain.lastReading?.waterLevel)}
                  </span>
                </span>
                <StatusBadge {...drainStatusInfo[drain.status]} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Activity({ district, ids }: { district?: string; ids: Set<string> }) {
  const audit = useAudit()
  return (
    <Card>
      <CardTitle>Atividade recente</CardTitle>
      <QueryView query={audit}>
        {(events) => {
          const visible = events
            .filter((event) => !district || ids.has(String(event.details.drainId)))
            .slice(0, 12)
          if (visible.length === 0) return <EmptyState title="Sem atividade no filtro" />
          return (
            <ol className="max-h-96 divide-y overflow-y-auto" tabIndex={0} aria-label="Eventos">
              {visible.map((event) => (
                <li key={event.id} className="p-2.5 text-sm">
                  <strong className="block">{auditTypeLabel[event.type] ?? event.type}</strong>
                  <span className="text-muted-foreground">
                    {event.entityId} · {formatDateTime(event.createdAt)}
                  </span>
                </li>
              ))}
            </ol>
          )
        }}
      </QueryView>
    </Card>
  )
}

export function DashboardPage() {
  const { district } = useSearch({ from: '/app/dashboard' })
  const navigate = useNavigate({ from: '/app/dashboard' })
  const summary = useSummary(district)
  // Audit events only carry the drain id, so the district filter needs the drain list.
  const districtDrains = useDistrictDrainIds(district)

  return (
    <Page>
      <PageHeader
        title="Visão geral"
        description="Estado da rede de drenagem em tempo real."
        actions={
          <Select
            aria-label="Filtrar por setor"
            className="w-52"
            value={district ?? ''}
            onChange={(event) =>
              void navigate({ search: { district: event.target.value || undefined } })
            }
          >
            <option value="">Todos os setores</option>
            {summary.data?.districts.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </Select>
        }
      />
      <QueryView query={summary}>
        {(data) => (
          <div className="grid gap-3">
            <Indicators data={data} district={district} />
            <div className="grid gap-3 lg:grid-cols-2">
              <Attention data={data} />
              <Activity district={district} ids={districtDrains} />
            </div>
            <Charts data={data} />
          </div>
        )}
      </QueryView>
    </Page>
  )
}

function useDistrictDrainIds(district?: string) {
  const drains = useDrains(Boolean(district))
  return new Set(
    drains.data?.filter((drain) => drain.district === district).map((drain) => drain.id),
  )
}
