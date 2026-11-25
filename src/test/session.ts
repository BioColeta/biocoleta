import { request } from '@/api/client'
import { useSession } from '@/api/session'
import { DEMO_CREDENTIALS } from '@/domain/constants'
import type { User } from '@/domain/types'

export async function signIn() {
  const { token, user } = await request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: DEMO_CREDENTIALS,
  })
  useSession.getState().start(token, user)
}
