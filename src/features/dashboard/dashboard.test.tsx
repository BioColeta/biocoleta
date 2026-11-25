import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { renderApp, server } from '@/test/render'
import { signIn } from '@/test/session'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

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
