import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { request } from '@/api/client'
import { useSession } from '@/api/session'
import { DEMO_CREDENTIALS } from '@/domain/constants'
import { renderApp, server } from '@/test/render'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

async function signIn() {
  const { token, user } = await request<{
    token: string
    user: { username: string; name: string }
  }>('/auth/login', { method: 'POST', body: DEMO_CREDENTIALS })
  useSession.getState().start(token, user)
}

describe('dashboard', () => {
  it('opens the filtered screen behind an indicator', async () => {
    await signIn()
    const user = userEvent.setup()
    const { router } = renderApp('/app/dashboard')
    await user.click(await screen.findByRole('link', { name: /Aguardando decisão/ }))
    expect(router.state.location.pathname).toBe('/app/alerts')
    expect(router.state.location.search).toMatchObject({ tab: 'new' })
  })

  it('shows empty states when the district filter matches nothing', async () => {
    await signIn()
    renderApp('/app/dashboard?district=Nenhum')
    expect(await screen.findByText('Nenhum bueiro no filtro')).toBeInTheDocument()
    expect(screen.getByText('Tudo normal por aqui')).toBeInTheDocument()
  })

  it('offers a retry when the summary fails', async () => {
    await signIn()
    server.use(
      http.get('*/api/dashboard/summary', () =>
        HttpResponse.json({ error: { code: 'x', message: 'Falhou' } }, { status: 500 }),
      ),
    )
    renderApp('/app/dashboard')
    expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })
})
