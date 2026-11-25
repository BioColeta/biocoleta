import type { Tone } from '@/components/status-badge'
import type { Band } from '@/domain/hydrology'

export const bandInfo: Record<Band, { label: string; tone: Tone }> = {
  normal: { label: 'Folga', tone: 'ok' },
  attention: { label: 'Atenção', tone: 'warning' },
  overload: { label: 'Sobrecarga', tone: 'danger' },
}

export const formatVolume = (liters: number) =>
  liters >= 1000
    ? `${(liters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m³`
    : `${Math.round(liters)} L`
