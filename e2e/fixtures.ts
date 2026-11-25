import { test as base, expect, type Page } from '@playwright/test'

/** Every test fails on an uncaught exception in any tab it opens. */
export const test = base.extend<{ crashes: string[] }>({
  crashes: [
    async ({ context }, use) => {
      const crashes: string[] = []
      context.on('weberror', (error) => {
        const { message } = error.error()
        // The mock worker's update check is rejected when a navigation interrupts it.
        if (!message.startsWith('Failed to update a ServiceWorker')) crashes.push(message)
      })
      await use(crashes)
      expect(crashes).toEqual([])
    },
    { auto: true },
  ],
})

export async function signIn(page: Page) {
  await page.goto('./login')
  await page.getByRole('button', { name: 'Entrar como operador de demonstração' }).click()
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
}

export async function openSimulator(page: Page) {
  await page.goto('./simulator')
  await page.getByLabel('Velocidade').selectOption('5')
}

export const newAlertFor = (page: Page, drain: string) =>
  page.getByRole('row').filter({ hasText: drain }).getByRole('link')

export { expect }
