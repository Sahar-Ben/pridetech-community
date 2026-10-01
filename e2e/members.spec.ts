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

test.describe('the member page', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole('button', { name: /^Alexandria-Konstantina/ }).click()
    await expect(page.getByRole('button', { name: /back to members/i })).toBeVisible()
  })

  test('offers LinkedIn, WhatsApp, Call and Email as working quick buttons', async ({ page }) => {
    const main = page.getByRole('main')

    await expect(main.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/member-without-scheme',
    )
    await expect(main.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/972500000000',
    )
    await expect(main.getByRole('link', { name: 'Call' })).toHaveAttribute(
      'href',
      'tel:+972500000000',
    )
    await expect(main.getByRole('link', { name: 'Email', exact: true })).toHaveAttribute(
      'href',
      /^mailto:averyvery/,
    )
  })

  test('copies one field, and everything at once', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.getByRole('button', { name: 'Copy phone' }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('050-000-0000')

    await page.getByRole('button', { name: 'Copy linkedin' }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'https://www.linkedin.com/in/member-without-scheme',
    )

    await page.getByRole('button', { name: 'Copy all contact details' }).click()
    const summary = await page.evaluate(() => navigator.clipboard.readText())
    expect(summary.split('\n')[0]).toMatch(/^Alexandria-Konstantina/)
    expect(summary).toContain('Phone: 050-000-0000')
    expect(summary).toContain('LinkedIn: https://www.linkedin.com/in/member-without-scheme')
  })
})
