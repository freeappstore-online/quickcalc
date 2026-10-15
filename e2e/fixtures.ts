// Shared e2e setup.
//
// - Requests leaving localhost are blocked, so runs never depend on (or
//   touch) the live platform API or analytics. The hosts the app tried to
//   reach are still recorded, for the privacy test.
// - Any uncaught page error fails the test.

import { test as base, expect, type Page } from '@playwright/test'

export const test = base.extend<{ pageErrors: string[]; hosts: Set<string> }>({
  hosts: async ({ context }, use) => {
    const hosts = new Set<string>()
    context.on('request', (r) => {
      const url = new URL(r.url())
      if (url.protocol.startsWith('http')) hosts.add(url.hostname)
    })
    await use(hosts)
  },
  context: async ({ context }, use) => {
    await context.route(
      (url) => url.hostname !== 'localhost' && url.protocol !== 'data:' && url.protocol !== 'blob:',
      (route) => route.abort(),
    )
    await use(context)
  },
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      await use(errors)
      expect(errors, 'uncaught page errors').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

/** Open a screen and wait for the app to settle. */
export async function open(page: Page, path = '/') {
  await page.goto(path, { waitUntil: 'networkidle' })
}

/** A result panel, by its label ("Total with tip"). */
export const result = (page: Page, label: string) => page.getByRole('region', { name: label, exact: true })

/** A toggle button in a Choice row (tip presets, modes, units). */
export const choice = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

/** Opens a calculator from its tile on the Calculators screen. */
export async function openTool(page: Page, name: string) {
  await open(page)
  await page.getByRole('link', { name: new RegExp(`^${name}`) }).click()
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
}
