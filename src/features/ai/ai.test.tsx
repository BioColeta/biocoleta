import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mutate, resetDb } from '@/mocks/db'
import { renderApp, server } from '@/test/render'
import { signIn } from '@/test/session'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(async () => {
  await resetDb()
  await signIn()
})

describe('analysis panel', () => {
  it('shows a structured, clearly simulated result', async () => {
    const user = userEvent.setup()
    renderApp('/app/alerts/ALT-0019')
    await user.click(await screen.findByRole('button', { name: 'Solicitar análise' }))
    expect(await screen.findByText(/Prompt v2/)).toBeInTheDocument()
    expect(screen.getByText('simulada')).toBeInTheDocument()
  })

  it('offers a retry on failure and keeps the manual decision', async () => {
    await mutate((db) => void (db.simulation.aiMode = 'unavailable'))
    const user = userEvent.setup()
    renderApp('/app/alerts/ALT-0019')
    await user.click(await screen.findByRole('button', { name: 'Solicitar análise' }))
    expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar obstrução' })).toBeEnabled()
  })
})
