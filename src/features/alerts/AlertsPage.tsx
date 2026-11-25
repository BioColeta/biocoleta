import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { Tabs } from 'radix-ui'
import { useAlerts } from '@/api/hooks'
import { DataTable } from '@/components/data-table'
import { Page, PageHeader } from '@/components/page'
import { QueryView } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { Select } from '@/components/ui/field'
import type { AlertView } from '@/domain/types'
import { formatDateTime, formatFlow, formatLevel } from '@/lib/format'
import { alertStatusInfo } from '@/lib/labels'
import { alertTabs, inTab, type AlertTab } from './tabs'

const column = createColumnHelper<AlertView>()

const columns = [
  column.accessor('id', {
    header: 'Alerta',
    cell: (info) => (
      <Link
        to="/app/alerts/$alertId"
        params={{ alertId: info.getValue() }}
        className="text-primary font-medium underline-offset-4 hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  column.accessor('drainId', { header: 'Bueiro' }),
  column.accessor('district', { header: 'Setor' }),
  column.accessor((alert) => alertStatusInfo[alert.status].label, {
    id: 'status',
    header: 'Situação',
    cell: (info) => <StatusBadge {...alertStatusInfo[info.row.original.status]} />,
  }),
  column.accessor('createdAt', {
    header: 'Criado em',
    cell: (info) => formatDateTime(info.getValue()),
  }),
  column.accessor((alert) => alert.evidence.readings.at(-1)?.waterLevel ?? 0, {
    id: 'level',
    header: 'Nível',
    cell: (info) => formatLevel(info.getValue()),
  }),
  column.accessor((alert) => alert.evidence.readings.at(-1)?.waterFlow ?? 0, {
    id: 'flow',
    header: 'Fluxo',
    cell: (info) => formatFlow(info.getValue()),
  }),
]

export function AlertsPage() {
  const { tab = 'new', district, q } = useSearch({ from: '/app/alerts' })
  const navigate = useNavigate({ from: '/app/alerts' })
  const alerts = useAlerts()
  const update = (patch: { tab?: AlertTab; district?: string; q?: string }) =>
    void navigate({ search: (current) => ({ ...current, ...patch }), replace: true })

  return (
    <Page>
      <PageHeader title="Alertas" description="O sistema sinaliza; a decisão é sua." />
      <QueryView query={alerts}>
        {(data) => {
          const scoped = data.filter((alert) => !district || alert.district === district)
          const districts = [...new Set(data.map((alert) => alert.district))].sort()
          return (
            <Tabs.Root
              value={tab}
              onValueChange={(value) => update({ tab: value as AlertTab })}
              className="grid min-w-0 gap-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Tabs.List className="bg-card flex flex-wrap gap-1 rounded-lg border p-1">
                  {alertTabs.map((item) => (
                    <Tabs.Trigger
                      key={item.value}
                      value={item.value}
                      className="data-[state=active]:bg-muted rounded-md px-3 py-1.5 text-sm data-[state=active]:font-medium"
                    >
                      {item.label} ({scoped.filter((a) => inTab(a.status, item.value)).length})
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
                <Select
                  aria-label="Filtrar por setor"
                  className="w-48"
                  value={district ?? ''}
                  onChange={(event) => update({ district: event.target.value || undefined })}
                >
                  <option value="">Todos os setores</option>
                  {districts.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </Select>
              </div>
              <Tabs.Content value={tab} className="min-w-0">
                <DataTable
                  label="Lista de alertas"
                  columns={columns}
                  data={scoped.filter((alert) => inTab(alert.status, tab))}
                  search={q ?? ''}
                  onSearchChange={(value) => update({ q: value || undefined })}
                />
              </Tabs.Content>
            </Tabs.Root>
          )
        }}
      </QueryView>
    </Page>
  )
}
