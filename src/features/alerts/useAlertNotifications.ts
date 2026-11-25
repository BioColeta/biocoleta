import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAlerts } from '@/api/hooks'

/** Announces alerts that appear while the panel is open and returns how many await a decision. */
export function useAlertNotifications(): number {
  const { data } = useAlerts()
  const navigate = useNavigate()
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!data) return
    const known = seen.current
    seen.current = new Set(data.map((alert) => alert.id))
    if (!known) return
    const fresh = data.filter((alert) => alert.status === 'new' && !known.has(alert.id))
    if (fresh.length > 3) {
      toast.warning(`${fresh.length} novos alertas`, {
        action: { label: 'Ver', onClick: () => void navigate({ to: '/app/alerts' }) },
      })
      return
    }
    for (const alert of fresh) {
      toast.warning(`Novo alerta em ${alert.drainId}`, {
        action: {
          label: 'Abrir',
          onClick: () =>
            void navigate({ to: '/app/alerts/$alertId', params: { alertId: alert.id } }),
        },
      })
    }
  }, [data, navigate])

  return data?.filter((alert) => alert.status === 'new').length ?? 0
}
