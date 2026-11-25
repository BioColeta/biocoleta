import { screen, within } from '@testing-library/react'
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

describe('work orders', () => {
  it('creates an order from a confirmed alert', async () => {
    const user = userEvent.setup()
    renderApp('/app/alerts/ALT-0019')
    await user.click(await screen.findByRole('button', { name: 'Confirmar obstrução' }))
    await user.click(screen.getByRole('button', { name: 'Registrar decisão' }))
    await user.click(await screen.findByRole('button', { name: 'Criar ordem de serviço' }))
    expect(await screen.findByRole('link', { name: 'Abrir quadro' })).toBeInTheDocument()
  })

  it('dispatches only after an explicit confirmation, using the menu', async () => {
    const user = userEvent.setup()
    renderApp('/app/work-orders')
    const open = await screen.findByRole('region', { name: 'Aberta' })
    const [menu] = within(open).getAllByRole('button', { name: /^Mover OS-/ })
    menu.focus()
    await user.keyboard('{Enter}')
    await user.click(await screen.findByRole('menuitem', { name: 'Mover para Despachada' }))
    // The dialog hides the board from assistive technology, hence `hidden`.
    expect(within(open).getAllByRole('article', { hidden: true })).toHaveLength(1)
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))
    expect(await within(open).findByText('Nenhuma ordem')).toBeInTheDocument()
  })
})
