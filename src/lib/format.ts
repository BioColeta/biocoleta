const decimal = (value: number, digits: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const formatLevel = (value: number | null | undefined) =>
  value == null ? '—' : `${decimal(value, 1)}%`

export const formatFlow = (value: number | null | undefined) =>
  value == null ? '—' : `${decimal(value, 2)} L/s`

export const formatDateTime = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

export const formatTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleTimeString('pt-BR') : '—'

export function formatMinutes(value: number | null): string {
  if (value === null) return '—'
  if (value < 60) return `${Math.round(value)} min`
  return `${Math.floor(value / 60)} h ${Math.round(value % 60)} min`
}

export const formatPercent = (ratio: number | null) =>
  ratio === null ? '—' : `${Math.round(ratio * 100)}%`
