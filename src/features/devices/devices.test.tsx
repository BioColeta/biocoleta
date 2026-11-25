import { screen } from '@testing-library/react'
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

describe('devices', () => {
  it('applies a quick filter and keeps it in the URL', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/app/devices')
    await user.click(await screen.findByRole('button', { name: /^Offline \(1\)/ }))
    expect(router.state.location.search).toMatchObject({ filter: 'offline' })
    expect(await screen.findByRole('link', { name: 'ESP32-DRAIN-1044' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'ESP32-DRAIN-0102' })).not.toBeInTheDocument()
  })

  it('highlights a tampered device', async () => {
    renderApp('/app/devices/ESP32-DRAIN-1207')
    expect(await screen.findByText('Violação da tampa')).toBeInTheDocument()
  })

  it('reports an unknown device', async () => {
    renderApp('/app/devices/ESP32-NADA')
    expect(await screen.findByText('Dispositivo não encontrado')).toBeInTheDocument()
  })
})
