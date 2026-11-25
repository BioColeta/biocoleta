import { StatusBadge } from '@/components/status-badge'
import type { DeviceView } from '@/domain/types'

export function DeviceFlags({ device }: { device: DeviceView }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {device.offline ? (
        <StatusBadge tone="neutral" label="Offline" />
      ) : (
        <StatusBadge tone="ok" label="Online" />
      )}
      {device.tamper && <StatusBadge tone="danger" label="Violação da tampa" />}
    </span>
  )
}
