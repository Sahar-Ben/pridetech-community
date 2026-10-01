import { expect, test } from '@playwright/test'
import { goTo, openWorkspace } from './support'

test.beforeEach(async ({ page }) => {
  await openWorkspace(page)
  await goTo(page, 'Members')
})

const rowCount = (page: import('@playwright/test').Page) =>
  page.getByRole('table', { name: 'Members' }).locator('tbody tr').count()

test('search narrows the list as you type', async ({ page }) => {
  const before = await rowCount(page)

  await page.getByRole('searchbox', { name: /search/i }).fill('Alexandria')

  await expect.poll(() => rowCount(page)).toBe(1)
  expect(before).toBeGreaterThan(1)
})

test('the status chips switch between active, everyone and ex-members', async ({ page }) => {
  const status = page.getByRole('group', { name: 'Status' })

  await status.getByRole('button', { name: 'Ex-members' }).click()
  await expect(status.getByRole('button', { name: 'Ex-members' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('table', { name: 'Members' })).toContainText('Former Member')
  await expect.poll(() => rowCount(page)).toBe(1)

  await status.getByRole('button', { name: 'All' }).click()
  await expect.poll(() => rowCount(page)).toBeGreaterThan(1)
})

test('a member opens, shows a working LinkedIn link, and goes back', async ({ page }) => {
  await page.getByRole('button', { name: /^Alexandria-Konstantina/ }).click()

  await expect(
    page.getByRole('link', { name: 'www.linkedin.com/in/member-without-scheme' }),
  ).toHaveAttribute('href', 'https://www.linkedin.com/in/member-without-scheme')

  await page.getByRole('button', { name: /back to members/i }).click()
  await expect(page.getByRole('table', { name: 'Members' })).toBeVisible()
})
