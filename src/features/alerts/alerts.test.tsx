import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '@/mocks/db'
import { renderApp, server } from '@/test/render'
import { signIn } from '@/test/session'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(async () => {
  await resetDb()
  await signIn()
})

describe('alert decision', () => {
  it('confirms an obstruction with a note and hides the actions', async () => {
    const user = userEvent.setup()
    renderApp('/app/alerts/ALT-0019')
    await user.click(await screen.findByRole('button', { name: 'Confirmar obstrução' }))
    await user.type(screen.getByLabelText('Observação (opcional)'), 'Folhas na grelha')
    await user.click(screen.getByRole('button', { name: 'Registrar decisão' }))
    expect(await screen.findByText(/Folhas na grelha/)).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Falso positivo' })).not.toBeInTheDocument(),
    )
  })

  it('offers no decision for a closed alert', async () => {
    renderApp('/app/alerts/ALT-0001')
    expect(await screen.findByText(/Encerrado automaticamente/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar obstrução' })).not.toBeInTheDocument()
  })

  it('lists only the alerts of the selected tab', async () => {
    renderApp('/app/alerts?tab=new')
    expect(await screen.findByRole('link', { name: 'ALT-0019' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'ALT-0001' })).not.toBeInTheDocument()
  })
})
