import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { useDevices } from '@/api/hooks'
import { DataTable } from '@/components/data-table'
import { Page, PageHeader } from '@/components/page'
import { QueryView } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/field'
import { LOW_BATTERY } from '@/domain/constants'
import type { DeviceView } from '@/domain/types'
import { formatDateTime } from '@/lib/format'
import { DeviceFlags } from './DeviceFlags'
import { deviceFilters, type DeviceFilter } from './filters'

const column = createColumnHelper<DeviceView>()

const columns = [
  column.accessor('id', {
    header: 'Dispositivo',
    cell: (info) => (
      <Link
        to="/app/devices/$deviceId"
        params={{ deviceId: info.getValue() }}
        className="text-primary font-medium underline-offset-4 hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  column.accessor('drainId', { header: 'Bueiro' }),
  column.accessor('district', { header: 'Setor' }),
  column.accessor((device) => (device.offline ? 'Offline' : 'Online'), {
    id: 'connection',
    header: 'Situação',
    cell: (info) => <DeviceFlags device={info.row.original} />,
  }),
  column.accessor('battery', {
    header: 'Bateria',
    cell: (info) => (
      <span className={info.getValue() < LOW_BATTERY ? 'text-danger font-semibold' : undefined}>
        {info.getValue()}%
      </span>
    ),
  }),
  column.accessor('signalDbm', { header: 'Sinal', cell: (info) => `${info.getValue()} dBm` }),
  column.accessor('lastSeenAt', {
    header: 'Última comunicação',
    cell: (info) => formatDateTime(info.getValue()),
  }),
]

export function DevicesPage() {
  const { filter, district } = useSearch({ from: '/app/devices' })
  const navigate = useNavigate({ from: '/app/devices' })
  const devices = useDevices()
  const update = (patch: { filter?: DeviceFilter; district?: string }) =>
    void navigate({ search: (current) => ({ ...current, ...patch }), replace: true })

  return (
    <Page>
      <PageHeader title="Dispositivos" description="Saúde dos sensores instalados nos bueiros." />
      <QueryView query={devices}>
        {(data) => {
          const scoped = data.filter((device) => !district || device.district === district)
          const active = deviceFilters.find((item) => item.value === filter)
          const districts = [...new Set(data.map((device) => device.district))].sort()
          return (
            <div className="grid min-w-0 gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {deviceFilters.map((item) => (
                  <Button
                    key={item.value}
                    size="sm"
                    variant={filter === item.value ? 'default' : 'outline'}
                    aria-pressed={filter === item.value}
                    onClick={() =>
                      update({ filter: filter === item.value ? undefined : item.value })
                    }
                  >
                    {item.label} ({scoped.filter(item.match).length})
                  </Button>
                ))}
                <Select
                  aria-label="Filtrar por setor"
                  className="ml-auto w-48"
                  value={district ?? ''}
                  onChange={(event) => update({ district: event.target.value || undefined })}
                >
                  <option value="">Todos os setores</option>
                  {districts.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </Select>
              </div>
              <DataTable
                label="Lista de dispositivos"
                columns={columns}
                data={active ? scoped.filter(active.match) : scoped}
              />
            </div>
          )
        }}
      </QueryView>
    </Page>
  )
}
