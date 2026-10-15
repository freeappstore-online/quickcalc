import { choice, expect, open, openTool, result, test } from './fixtures'

// Each tool reopens as it was left, across a full page reload.

test('tip inputs and choices survive a reload', async ({ page }) => {
  await openTool(page, 'Tip & split')
  await page.getByLabel('Bill').fill('84.20')
  await choice(page, 'Custom').click()
  await page.getByLabel('Custom tip').fill('22')
  await page.getByLabel('People').fill('4')
  await choice(page, 'Total').click()
  await expect(result(page, 'Total with tip')).toContainText('$103.00')

  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByLabel('Bill')).toHaveValue('84.20')
  await expect(choice(page, 'Custom')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Custom tip')).toHaveValue('22')
  await expect(page.getByLabel('People')).toHaveValue('4')
  await expect(choice(page, 'Total')).toHaveAttribute('aria-pressed', 'true')
  await expect(result(page, 'Total with tip')).toContainText('$103.00')
})

test('every tool keeps its own inputs, and the unit choice is kept', async ({ page }) => {
  await openTool(page, 'Percent')
  await choice(page, '% change').click()
  await page.getByLabel('From').fill('40')
  await page.getByLabel('To').fill('50')

  await openTool(page, 'Discount')
  await page.getByLabel('Price', { exact: true }).fill('59.99')
  await page.getByLabel('Discount', { exact: true }).fill('30')

  await openTool(page, 'Age & date')
  await choice(page, 'Days between').click()
  await page.getByLabel('From').fill('2026-01-01')
  await page.getByLabel('To').fill('2026-12-25')

  await openTool(page, 'Fuel')
  await choice(page, 'miles · UK mpg').click()
  await page.getByLabel('Distance').fill('120')
  await page.getByLabel('Fuel economy').fill('45')
  await page.getByLabel('Price per UK gallon').fill('6.5')

  await page.reload({ waitUntil: 'networkidle' })
  await expect(choice(page, 'miles · UK mpg')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Distance')).toHaveValue('120')
  await expect(result(page, 'Trip cost')).toContainText('$17.33')

  await open(page, '/percent')
  await expect(choice(page, '% change')).toHaveAttribute('aria-pressed', 'true')
  await expect(result(page, 'Change')).toContainText('+25%')

  await open(page, '/discount')
  await expect(page.getByLabel('Price', { exact: true })).toHaveValue('59.99')
  await expect(result(page, 'You pay')).toContainText('$41.99')

  await open(page, '/date')
  await expect(result(page, 'Days between')).toContainText('358 days')
})

test('the currency choice survives a reload and applies to every tool', async ({ page }) => {
  await open(page)
  await page.getByLabel('Currency').selectOption('EUR')
  await openTool(page, 'Discount')
  await page.getByLabel('Price', { exact: true }).fill('10')
  await page.getByLabel('Discount', { exact: true }).fill('50')
  await expect(result(page, 'You pay')).toContainText('€5.00')

  await page.reload({ waitUntil: 'networkidle' })
  await expect(result(page, 'You pay')).toContainText('€5.00')
  await open(page)
  await expect(page.getByLabel('Currency')).toHaveValue('EUR')
})
