import { choice, expect, open, result, test } from './fixtures'

test.describe('offline', () => {
  test('after one visit every calculator works with no network', async ({ page, context }) => {
    await open(page)
    // Wait for the service worker to install and take control of the page.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
        )
      }
    })

    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name: 'Calculators' })).toBeVisible()

    // Deep links load from the cache too (SPA fallback), and calculate.
    await page.goto('/tip', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Bill').fill('40')
    await choice(page, '15%').click()
    await page.getByLabel('People').fill('2')
    await expect(result(page, 'Each person pays')).toContainText('$23.00')

    for (const [path, heading] of [
      ['/percent', 'Percent'],
      ['/discount', 'Discount'],
      ['/date', 'Age & date'],
      ['/fuel', 'Fuel'],
      ['/about', 'About'],
    ]) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    }
    await context.setOffline(false)
  })
})
