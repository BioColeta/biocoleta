import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { readDb, resetDb } from '@/mocks/db'
import { renderApp, server } from '@/test/render'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(() => resetDb())

describe('simulator', () => {
  it('is public and applies the chosen scenario to the drain', async () => {
    const user = userEvent.setup()
    renderApp('/simulator')
    await user.click(await screen.findByRole('button', { name: 'Obstrução' }))
    await screen.findByText(/atual: Obstrução/)
    expect(readDb().simulation.scenarios['BUEIRO-0102']).toBe('obstruction')
  })

  it('shows the request and response of a manual send', async () => {
    const user = userEvent.setup()
    renderApp('/simulator')
    await user.click(await screen.findByRole('button', { name: /Enviar agora/ }))
    const log = screen.getByRole('log')
    expect(await within(log).findByText(/201/)).toBeInTheDocument()
    expect(log).toHaveTextContent('"device_id": "ESP32-DRAIN-0102"')
  })
})
