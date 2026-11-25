import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { request } from '@/api/client'
import { useSession } from '@/api/session'
import { DEMO_CREDENTIALS } from '@/domain/constants'
import { renderApp, server } from '@/test/render'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
afterEach(() => useSession.getState().end())

describe('route guard and login', () => {
  it('sends a visitor to login and back to the requested route', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/app/history')
    await screen.findByRole('heading', { name: 'Acessar o painel' })
    await user.type(screen.getByLabelText('Usuário'), DEMO_CREDENTIALS.username)
    await user.type(screen.getByLabelText('Senha'), DEMO_CREDENTIALS.password)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/history'))
  })

  it('shows the error and keeps the typed username', async () => {
    const user = userEvent.setup()
    renderApp('/login')
    await user.type(await screen.findByLabelText('Usuário'), 'maria')
    await user.type(screen.getByLabelText('Senha'), 'errada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha inválidos')
    expect(screen.getByLabelText('Usuário')).toHaveValue('maria')
  })

  it('ends the session when the API answers 401', async () => {
    useSession.getState().start('expired', { username: 'operator', name: 'Operador' })
    await expect(request('/alerts')).rejects.toMatchObject({ status: 401 })
    expect(useSession.getState().token).toBeNull()
  })
})
