import { readFileSync } from 'node:fs'
import { choice, expect, open, openTool, test } from './fixtures'

// Privacy. The live host's edge injects Cloudflare Web Analytics; the app
// itself must only ever talk to the FreeAppStore platform.

const ALLOWED_HOSTS = new Set(['localhost', 'api.freeappstore.online'])

test('About discloses on-device maths, local storage and the analytics', async ({ page }) => {
  await open(page, '/about')
  const privacy = page.getByRole('region', { name: 'Privacy' })
  await expect(privacy).toBeVisible()
  await expect(privacy).toContainText('Every calculation stays on your device.')
  await expect(privacy).toContainText('localStorage')
  await expect(privacy).toContainText('api.freeappstore.online/v1/analytics.js')
  await expect(privacy).toContainText('without cookies')
  await expect(privacy).toContainText('Your inputs and results are never included.')
  await expect(privacy).toContainText('Cloudflare Web Analytics')
  await expect(privacy).toContainText('static.cloudflareinsights.com')
  await expect(privacy).toContainText('IP address')
})

test('inputs are stored only in this browser, and the app contacts only FreeAppStore', async ({ page, hosts }) => {
  await openTool(page, 'Tip & split')
  await page.getByLabel('Bill').fill('123.45')
  await choice(page, '20%').click()
  for (const name of ['Percent', 'Discount', 'Age & date', 'Fuel']) await openTool(page, name)
  await open(page, '/about')

  expect([...hosts].filter((h) => !ALLOWED_HOSTS.has(h))).toEqual([])
  const saved = await page.evaluate(() => localStorage.getItem('quickcalc:tip'))
  expect(saved).toContain('123.45')
})

test('works in the dark theme too', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('stores-theme', 'dark'))
  await openTool(page, 'Tip & split')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const ink = await page.getByLabel('Bill').evaluate((el) => getComputedStyle(el).color)
  expect(ink).toBe('rgb(240, 240, 240)')
})

test('launch copy is the same everywhere and nothing says "coming soon"', async ({ page }) => {
  const line = 'Everyday calculators: tip & split, percent, discount, age & date, fuel. Private and offline.'
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const manifest = JSON.parse(readFileSync('web/public/manifest.json', 'utf8'))
  expect(pkg.description).toBe(line)
  expect(manifest.description).toBe(line)
  await open(page)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', line)
  for (const path of ['/', '/tip', '/percent', '/discount', '/date', '/fuel', '/about']) {
    await open(page, path)
    await expect(page.locator('body')).not.toContainText(/coming soon/i)
  }
})
