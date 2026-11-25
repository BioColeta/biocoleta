import { LOW_BATTERY } from '@/domain/constants'
import type { DeviceView } from '@/domain/types'

export const deviceFilters = [
  { value: 'offline', label: 'Offline', match: (d: DeviceView) => d.offline },
  {
    value: 'low_battery',
    label: `Bateria abaixo de ${LOW_BATTERY}%`,
    match: (d: DeviceView) => d.battery < LOW_BATTERY,
  },
  { value: 'tamper', label: 'Violação', match: (d: DeviceView) => d.tamper },
] as const

export type DeviceFilter = (typeof deviceFilters)[number]['value']
