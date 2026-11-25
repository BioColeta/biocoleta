import AxeBuilder from '@axe-core/playwright'
import { expect, signIn, test } from './fixtures'

const publicRoutes = ['./', './login', './simulator']
const panelRoutes = [
  './app/dashboard',
  './app/map',
  './app/map?drain=BUEIRO-0318',
  './app/alerts',
  './app/alerts/ALT-0019',
  './app/work-orders',
  './app/devices',
  './app/devices/ESP32-DRAIN-0102',
  './app/planning',
  './app/history',
  './app/settings',
  './nao-existe',
]

test('a protected route survives login and reload under the public base path', async ({ page }) => {
  await page.goto('./app/map?drain=BUEIRO-0318')
  await expect(page).toHaveURL(/\/biocoleta\/login\?redirect=/)
  await page.getByRole('button', { name: 'Entrar como operador de demonstração' }).click()
  await expect(page).toHaveURL(/\/biocoleta\/app\/map\?drain=BUEIRO-0318/)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mapa operacional' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'BUEIRO-0318' })).toBeVisible()
})

test('logging out protects the panel again', async ({ page }) => {
  await signIn(page)
  await page.getByRole('button', { name: /^Menu de/ }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.goto('./app/alerts')
  await expect(page).toHaveURL(/\/login/)
})

test('the map shows markers that open the drain panel', async ({ page }) => {
  await signIn(page)
  await page.goto('./app/map?q=0318')
  await page.getByRole('button', { name: 'BUEIRO-0318, Obstruído' }).click()
  await expect(page).toHaveURL(/drain=BUEIRO-0318/)
  await expect(page.getByRole('link', { name: /Abrir alerta ALT-/ })).toBeVisible()
})

test('the command palette finds a drain with the keyboard', async ({ page }) => {
  await signIn(page)
  await page.keyboard.press('ControlOrMeta+k')
  await page.keyboard.type('BUEIRO-0771')
  await expect(page.getByRole('option', { name: /BUEIRO-0771/ })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/drain=BUEIRO-0771/)
})

test('the first screen loads neither the map nor the charts', async ({ page }) => {
  const scripts: string[] = []
  page.on('response', (response) => {
    if (response.url().endsWith('.js')) scripts.push(response.url())
  })
  await page.goto('./')
  await expect(page.getByRole('link', { name: 'Abrir o painel' }).first()).toBeInViewport()
  await expect(page.getByRole('link', { name: 'Testar o simulador' }).first()).toBeInViewport()
  await page.waitForLoadState('networkidle')
  const bodies = await Promise.all(scripts.map(async (url) => (await page.request.get(url)).text()))
  for (const body of bodies) {
    expect(body).not.toContain('maplibregl-canvas')
    expect(body).not.toContain('recharts-wrapper')
  }
})

for (const theme of ['dark', 'light'] as const) {
  test(`no serious accessibility problems in the ${theme} theme`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript((value) => {
      localStorage.setItem(
        'biocoleta:theme',
        JSON.stringify({ state: { theme: value }, version: 0 }),
      )
    }, theme)
    await signIn(page)
    const problems: string[] = []
    for (const route of [...publicRoutes, ...panelRoutes]) {
      await page.goto(route)
      await expect(page.getByRole('heading').first()).toBeVisible()
      await page.waitForTimeout(1200)
      // Map tiles and attribution are third-party markup inside the canvas container.
      const result = await new AxeBuilder({ page }).exclude('.maplibregl-ctrl').analyze()
      for (const violation of result.violations) {
        if (violation.impact !== 'serious' && violation.impact !== 'critical') continue
        const where = violation.nodes.slice(0, 3).map((node) => node.target.join(' '))
        problems.push(`${route} ${violation.id}: ${where.join(' | ')}`)
      }
    }
    expect(problems).toEqual([])
  })
}

test('no page scrolls sideways on a 360px screen', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 360, height: 740 })
  await signIn(page)
  const overflowing: string[] = []
  for (const route of [...publicRoutes, ...panelRoutes]) {
    await page.goto(route)
    await expect(page.getByRole('heading').first()).toBeVisible()
    await page.waitForTimeout(1000)
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    if (width > 360) overflowing.push(`${route}: ${width}px`)
  }
  expect(overflowing).toEqual([])
})
