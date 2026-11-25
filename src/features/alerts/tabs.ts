import type { AlertStatus } from '@/domain/types'

export const alertTabs = [
  { value: 'new', label: 'Novos' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'closed', label: 'Encerrados' },
  { value: 'all', label: 'Todos' },
] as const

export type AlertTab = (typeof alertTabs)[number]['value']

export function inTab(status: AlertStatus, tab: AlertTab) {
  if (tab === 'all') return true
  if (tab === 'closed') return status === 'cleared' || status === 'false_positive'
  return status === tab
}
