import { expect, test, type Page } from '@playwright/test'
import { goTo, openWorkspace, SECTIONS } from './support'

/* Google allows about 60 reads a minute per person, and going over it failed
   every screen with "Quota exceeded". Moving around the app must not read the
   same tabs again and again: screens share what was read a moment ago, and
   only Reload, Try again and the app's own writes send them back to Google. */

const readsSoFar = async (page: Page): Promise<string[]> =>
  await page.evaluate(() => [...window.harnessReads])

test('moving between every section, twice, reads each tab once', async ({ page }) => {
  await openWorkspace(page)

  for (let lap = 0; lap < 2; lap += 1) {
    for (const section of SECTIONS) {
      await goTo(page, section)
    }
  }
  await goTo(page, 'Overview')

  const reads = await readsSoFar(page)
  const repeated = reads.filter((range, index) => reads.indexOf(range) !== index)
  expect(repeated, `ranges read more than once: ${repeated.join(', ')}`).toEqual([])
  expect(reads.length).toBeLessThan(15)
})

test('Reload applications reads the sheet again, for changes made in Google Sheets', async ({
  page,
}) => {
  await openWorkspace(page)
  await goTo(page, 'Leads')
  const before = (await readsSoFar(page)).length

  await page.getByRole('button', { name: 'Reload applications' }).click()

  await expect.poll(async () => (await readsSoFar(page)).length).toBeGreaterThan(before)
})

test('after approving, the Members screen shows the new member rather than an old copy', async ({
  page,
}) => {
  await openWorkspace(page)
  await goTo(page, 'Members')
  await goTo(page, 'Leads')
  const card = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: 'LinkedIn Case 6', exact: true, level: 3 }) })

  await card.getByRole('radio', { name: 'M' }).check({ force: true })
  await card.getByRole('button', { name: 'Approve' }).click()
  await expect(card).toHaveCount(0)

  await goTo(page, 'Members')
  await page.getByRole('searchbox', { name: /search/i }).fill('LinkedIn Case 6')
  await expect(page.getByRole('table', { name: 'Members' })).toContainText('LinkedIn Case 6')
})
