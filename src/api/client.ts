import { useSession } from '@/api/session'

const API_URL: string = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

type Options = { method?: string; body?: unknown; headers?: Record<string, string> }

export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { token } = useSession.getState()
  const url = new URL(`${API_URL}/api${path}`, window.location.origin)
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = (payload as { error?: { code: string; message: string } } | null)?.error
    if (response.status === 401 && token) useSession.getState().end()
    throw new ApiError(
      response.status,
      error?.code ?? 'unexpected',
      error?.message ?? 'Não foi possível falar com a API',
    )
  }
  if (payload === null)
    throw new ApiError(response.status, 'unexpected', 'Resposta inválida da API')
  return payload as T
}
