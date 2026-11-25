import { expect, newAlertFor, openSimulator, signIn, test } from './fixtures'

const DRAIN = 'BUEIRO-0102'

test('obstruction, alert, decision, work order and automatic clearing', async ({
  page,
  context,
}) => {
  await signIn(page)
  const simulator = await context.newPage()
  await openSimulator(simulator)
  await simulator.getByRole('button', { name: 'Obstrução', exact: true }).click()

  await page.bringToFront()
  await page.goto('./app/alerts?tab=new')
  await newAlertFor(page, DRAIN).click()
  await page.getByRole('button', { name: 'Solicitar análise' }).click()
  await expect(page.getByText('Provável obstrução').first()).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar obstrução' }).click()
  await page.getByRole('button', { name: 'Registrar decisão' }).click()
  await page.getByRole('button', { name: 'Criar ordem de serviço' }).click()
  const panel = page.getByRole('region', { name: 'Ordem de serviço', exact: true })
  const order = (await panel.locator('strong').innerText()).trim()
  const alertUrl = page.url()

  await panel.getByRole('link', { name: 'Abrir quadro' }).click()
  const move = async (to: string) => {
    await page.getByRole('button', { name: `Mover ${order}` }).click()
    await page.getByRole('menuitem', { name: `Mover para ${to}` }).click()
  }
  const column = (name: string) =>
    page.getByRole('region', { name, exact: true }).getByRole('article', { name: `Ordem ${order}` })
  await move('Despachada')
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(column('Despachada')).toBeVisible()
  await move('Em execução')
  await expect(column('Em execução')).toBeVisible()
  await move('Concluída')
  await expect(column('Concluída')).toBeVisible()

  await page.goto(alertUrl)
  await expect(page.getByText('Encerrado automaticamente')).toBeVisible()
})

test('two manual readings reach the panel in another tab, then a false positive', async ({
  page,
  context,
}) => {
  await signIn(page)
  await page.goto('./app/alerts?tab=new')
  const simulator = await context.newPage()
  await simulator.goto('./simulator')
  await simulator.getByRole('button', { name: 'Pausar motor' }).click()
  await simulator.getByRole('slider', { name: 'Nível da água' }).press('End')
  await simulator.getByRole('slider', { name: 'Fluxo de saída' }).press('Home')
  const send = simulator.getByRole('button', { name: 'Enviar agora' })
  await send.click()
  await expect(simulator.getByRole('log')).toContainText('"alertId":null')
  await send.click()
  await expect(simulator.getByRole('log')).toContainText('"alertId":"ALT-')

  await expect(newAlertFor(page, DRAIN)).toBeVisible({ timeout: 5000 })
  await newAlertFor(page, DRAIN).click()
  await page.getByRole('button', { name: 'Falso positivo' }).click()
  await page.getByRole('button', { name: 'Registrar decisão' }).click()
  await expect(page.getByText('Marcado como falso positivo').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar obstrução' })).toHaveCount(0)
})

test('the decision and the work order work with the keyboard only', async ({ page }) => {
  await signIn(page)
  await page.goto('./app/alerts/ALT-0019')
  const press = async (name: string, role: 'button' | 'menuitem' = 'button') => {
    const target = page.getByRole(role, { name, exact: true })
    await target.focus()
    await page.keyboard.press('Enter')
  }
  await press('Confirmar obstrução')
  await press('Registrar decisão')
  await press('Criar ordem de serviço')
  await page.getByRole('link', { name: 'Abrir quadro' }).press('Enter')
  await press('Mover OS-0006')
  await press('Mover para Despachada', 'menuitem')
  await press('Confirmar')
  await expect(
    page
      .getByRole('region', { name: 'Despachada', exact: true })
      .getByRole('article', { name: 'Ordem OS-0006' }),
  ).toBeVisible()
})

test('guided script follows the demo from start to finish', async ({ page, context }) => {
  await signIn(page)
  const simulator = await context.newPage()
  await openSimulator(simulator)
  await simulator.getByRole('button', { name: 'Iniciar roteiro' }).click()
  await simulator.getByRole('button', { name: 'Obstruir' }).click()
  const popup = context.waitForEvent('page')
  await simulator.getByRole('button', { name: 'Abrir alerta' }).click()
  const alert = await popup
  await alert.getByRole('button', { name: 'Confirmar obstrução' }).click()
  await alert.getByRole('button', { name: 'Registrar decisão' }).click()
  await simulator.bringToFront()
  await simulator.getByRole('button', { name: 'Normalizar' }).click()
  await expect(simulator.getByText('Ciclo completo demonstrado.')).toBeVisible()
})
