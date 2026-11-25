import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readDb, resetDb } from '@/mocks/db'
import { renderApp, server } from '@/test/render'
import { signIn } from '@/test/session'

// WebGL does not exist in jsdom; the map itself is covered by the browser tests.
vi.mock('./ReliefMap', () => ({ ReliefMap: () => null }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(async () => {
  await resetDb()
  await signIn()
})

describe('rain planning', () => {
  it('keeps the chosen rain in the URL and declares it is an estimate', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/app/planning')
    await user.click(await screen.findByRole('button', { name: 'Extrema · 100 mm/h' }))
    expect(router.state.location.search).toMatchObject({ intensity: 100 })
    expect(screen.getByText(/Estimativa didática/)).toBeInTheDocument()
  })

  it('creates a preventive order only after confirmation', async () => {
    const user = userEvent.setup()
    renderApp('/app/planning')
    const ranking = await screen.findByRole('list', { name: 'Ranking de limpeza' })
    const orders = () => readDb().workOrders.filter((order) => order.type === 'preventive')
    const [create] = within(ranking).getAllByRole('button', { name: 'Criar ordem preventiva' })
    await user.click(create)
    expect(orders()).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Confirmar ordem preventiva' }))
    expect(await within(ranking).findAllByRole('link', { name: /Ordem OS-/ })).not.toHaveLength(0)
    expect(orders()).toHaveLength(1)
  })
})
