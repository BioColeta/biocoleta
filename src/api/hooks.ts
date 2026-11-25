import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from '@/api/client'
import { useSession } from '@/api/session'
import type { DashboardSummary } from '@/domain/metrics'
import type { TelemetryPayload } from '@/domain/telemetry'
import { analysisSchema } from '@/domain/types'
import type {
  AlertView,
  Analysis,
  AuditEvent,
  DecisionOutcome,
  DemoDrain,
  DeviceView,
  DrainView,
  Prompt,
  Reading,
  Simulation,
  User,
  WorkOrderStatus,
  WorkOrderView,
} from '@/domain/types'
import type { NewWorkOrder } from '@/mocks/services/operations'
import type { SimulationPatch } from '@/mocks/services/simulation'
import { DEMO_DEVICE_KEY } from '@/domain/constants'

export const REFRESH_MS = 3000

function useLive<T>(key: unknown[], path: string, enabled = true) {
  return useQuery({
    queryKey: key,
    queryFn: () => request<T>(path),
    refetchInterval: REFRESH_MS,
    enabled,
  })
}

export const useDrains = (enabled = true) => useLive<DrainView[]>(['drains'], '/drains', enabled)
export const useDrain = (id: string) => useLive<DrainView>(['drains', id], `/drains/${id}`)
export const useTelemetry = (drainId: string) =>
  useLive<Reading[]>(['telemetry', drainId], `/drains/${drainId}/telemetry?limit=60`)
export const useDevices = () => useLive<DeviceView[]>(['devices'], '/devices')
export const useDevice = (id: string) => useLive<DeviceView>(['devices', id], `/devices/${id}`)
export const useAlerts = (enabled = true) => useLive<AlertView[]>(['alerts'], '/alerts', enabled)
export const useAlert = (id: string) => useLive<AlertView>(['alerts', id], `/alerts/${id}`)
export const useWorkOrders = () => useLive<WorkOrderView[]>(['work-orders'], '/work-orders')
export const useAudit = () => useLive<AuditEvent[]>(['audit'], '/audit')
export const useSummary = (district?: string) =>
  useLive<DashboardSummary>(
    ['summary', district ?? ''],
    `/dashboard/summary${district ? `?district=${encodeURIComponent(district)}` : ''}`,
  )
export const useDemoDrains = () => useLive<DemoDrain[]>(['demo', 'drains'], '/demo/drains')
export const useSimulation = () => useLive<Simulation>(['demo', 'simulation'], '/demo/simulation')
export const useAnalyses = (alertId: string) =>
  useLive<Analysis[]>(['analyses', alertId], `/alerts/${alertId}/analyses`)
export const usePrompts = () => useLive<Prompt[]>(['prompts'], '/prompts')

function useApiMutation<Input, Output>(send: (input: Input) => Promise<Output>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: send,
    onSettled: () => client.invalidateQueries(),
  })
}

export const useLogin = () =>
  useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: credentials }),
    onSuccess: ({ token, user }) => useSession.getState().start(token, user),
  })

export const useDecision = (alertId: string) =>
  useApiMutation((body: { outcome: DecisionOutcome; note?: string }) =>
    request<AlertView>(`/alerts/${alertId}/decision`, { method: 'POST', body }),
  )

export const useRequestAnalysis = (alertId: string) =>
  useApiMutation(async () =>
    analysisSchema.parse(await request(`/alerts/${alertId}/analysis`, { method: 'POST' })),
  )

export const useActivatePrompt = () =>
  useApiMutation((version: string) =>
    request<Prompt[]>(`/prompts/${version}/activate`, { method: 'PUT' }),
  )

export const useCreateWorkOrder = () =>
  useApiMutation((body: NewWorkOrder) =>
    request<WorkOrderView>('/work-orders', { method: 'POST', body }),
  )

export const useMoveWorkOrder = () =>
  useApiMutation(({ id, status }: { id: string; status: WorkOrderStatus }) =>
    request<WorkOrderView>(`/work-orders/${id}`, { method: 'PATCH', body: { status } }),
  )

export const useUpdateSimulation = () =>
  useApiMutation((body: SimulationPatch) =>
    request<Simulation>('/demo/simulation', { method: 'PUT', body }),
  )

export const useResetDemo = () =>
  useApiMutation(() => request<{ ok: boolean }>('/demo/reset', { method: 'POST' }))

export const sendTelemetry = (payload: TelemetryPayload) =>
  request<{ id: number; alertId: string | null }>('/telemetry', {
    method: 'POST',
    body: payload,
    headers: { 'X-Device-Key': DEMO_DEVICE_KEY },
  })
