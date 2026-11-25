import { expect, signIn, test } from './fixtures'

// Blocking at the resolver also covers requests that pass through the mock service worker.
test.use({
  launchOptions: {
    args: [
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--host-resolver-rules=MAP tiles.openfreemap.org ~NOTFOUND, MAP s3.amazonaws.com ~NOTFOUND',
    ],
  },
})

test('markers and the drain panel work without the base map', async ({ page }) => {
  await signIn(page)
  await page.goto('./app/map?q=0318')
  await expect(page.getByText('Mapa base indisponível')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'BUEIRO-0318, Obstruído' }).click()
  await expect(page.getByRole('link', { name: /Abrir alerta/ })).toBeVisible()
})

test('rain planning falls back to 2D without relief tiles', async ({ page }) => {
  await signIn(page)
  await page.goto('./app/planning')
  await expect(page.getByText('Relevo indisponível')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: /^BUEIRO-0450, / })).toBeVisible()
})
