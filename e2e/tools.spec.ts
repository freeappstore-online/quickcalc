import { choice, expect, open, openTool, result, test } from './fixtures'

// One real calculation per tool, typed the way a person would.

test('Tip & split: shares add up and the leftover cent is shown', async ({ page }) => {
  await openTool(page, 'Tip & split')
  await page.getByLabel('Bill').fill('100')
  await choice(page, '18%').click()
  await page.getByLabel('People').fill('3')
  await expect(result(page, 'Total with tip')).toContainText('$118.00')
  await expect(result(page, 'Total with tip')).toContainText('Tip $18.00')
  await expect(result(page, 'Each person pays')).toContainText('$39.33')
  await expect(result(page, 'Each person pays')).toContainText('1 person pays $39.34')

  await choice(page, 'Per person').click()
  await expect(result(page, 'Each person pays')).toContainText('$40.00')
  await expect(result(page, 'Total with tip')).toContainText('$120.00')

  await page.getByLabel('People').fill('0')
  await expect(page.getByRole('alert')).toHaveText('Enter at least 1 person.')
})

test('Percent: X% of Y, what percent, and % change', async ({ page }) => {
  await openTool(page, 'Percent')
  await page.getByLabel('Percent', { exact: true }).fill('15')
  await page.getByLabel('Of', { exact: true }).fill('80')
  await expect(result(page, 'Result')).toContainText('12')

  await choice(page, 'X is what % of Y').click()
  await page.getByLabel('Value').fill('20')
  await page.getByLabel('Of total').fill('80')
  await expect(result(page, 'Is this percent')).toContainText('25%')

  await choice(page, '% change').click()
  await page.getByLabel('From').fill('100')
  await page.getByLabel('To').fill('80')
  await expect(result(page, 'Decrease')).toContainText('-20%')
  await page.getByLabel('From').fill('0')
  await expect(result(page, 'Change')).toContainText('Undefined')
})

test('Discount: stacked discounts and tax', async ({ page }) => {
  await openTool(page, 'Discount')
  await page.getByLabel('Price', { exact: true }).fill('100')
  await page.getByLabel('Discount', { exact: true }).fill('20')
  await page.getByLabel('Then a second discount (optional)').fill('10')
  await page.getByLabel('Tax (optional)').fill('8.25')
  await expect(result(page, 'You pay')).toContainText('$77.94')
  await expect(result(page, 'You pay')).toContainText('$72.00 before tax')
  await expect(result(page, 'You save')).toContainText('$28.00')
  await expect(result(page, 'You save')).toContainText('28% off in total')
  await expect(result(page, 'Tax added')).toContainText('$5.94')

  await choice(page, 'Includes tax').click()
  await expect(result(page, 'You pay')).toContainText('$72.00')
  await expect(result(page, 'Tax included')).toContainText('$5.49')
})

test('Age & date: leap-year age, days between, add a month, weekday', async ({ page }) => {
  await openTool(page, 'Age & date')
  await page.getByLabel('Date of birth').fill('2000-02-29')
  await page.getByLabel('Age on').fill('2024-02-28')
  await expect(result(page, 'Age')).toContainText('23 years, 11 months, 30 days')

  await choice(page, 'Days between').click()
  await page.getByLabel('From').fill('2024-02-01')
  await page.getByLabel('To').fill('2024-03-01')
  await expect(result(page, 'Days between')).toContainText('29 days')

  await choice(page, 'Add or subtract').click()
  await page.getByLabel('Start').fill('2023-01-31')
  await page.getByLabel('How many').fill('1')
  await choice(page, 'Months').click()
  await expect(result(page, 'Date')).toContainText('Tuesday, February 28, 2023')
  await expect(result(page, 'Date')).toContainText('Moved to the last day of the month.')

  await choice(page, 'Weekday').click()
  await page.getByLabel('Date', { exact: true }).fill('2000-01-01')
  await expect(result(page, 'Weekday')).toContainText('Saturday')
})

test('Fuel: trip cost, round trip, and units switch back without drift', async ({ page }) => {
  await openTool(page, 'Fuel')
  await page.getByLabel('Distance').fill('250')
  await page.getByLabel('Fuel economy').fill('6.5')
  await page.getByLabel('Price per litre').fill('1.80')
  await expect(result(page, 'Trip cost')).toContainText('$29.25')
  await expect(result(page, 'Trip cost')).toContainText('16.25 L of fuel for 250 km')

  await choice(page, 'Round trip').click()
  await expect(result(page, 'Trip cost')).toContainText('$58.50')
  await page.getByLabel('Split between').fill('4')
  await expect(result(page, 'Each person pays')).toContainText('$14.62')
  await expect(result(page, 'Each person pays')).toContainText('2 people pay $14.63')

  await choice(page, 'miles · US mpg').click()
  await expect(page.getByLabel('Distance')).toHaveValue('155.34')
  await expect(page.getByLabel('Fuel economy')).toHaveValue('36.19')
  await expect(page.getByLabel('Price per US gallon')).toHaveValue('6.814')
  await expect(result(page, 'Trip cost')).toContainText('$58.50')
  await choice(page, 'km · L/100km').click()
  await expect(page.getByLabel('Distance')).toHaveValue('250')
  await expect(page.getByLabel('Fuel economy')).toHaveValue('6.5')
  await expect(page.getByLabel('Price per litre')).toHaveValue('1.80')
})

test('a result copies with one tap', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await openTool(page, 'Tip & split')
  await page.getByLabel('Bill').fill('50')
  await choice(page, '20%').click()
  await page.getByLabel('People').fill('2')
  await page.getByRole('button', { name: 'Copy total with tip' }).click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('$60.00')
})

test('every tile opens its tool and the back link returns', async ({ page }) => {
  for (const name of ['Tip & split', 'Percent', 'Discount', 'Age & date', 'Fuel']) {
    await openTool(page, name)
    await expect(page).toHaveTitle(`${name} — Everyday Calculators`)
    await page.getByRole('link', { name: '← All calculators' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Calculators' })).toBeVisible()
  }
  await open(page, '/nowhere')
  await expect(page.getByRole('heading', { level: 1, name: 'Calculators' })).toBeVisible()
})
