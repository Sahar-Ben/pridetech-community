import { expect, test } from '@playwright/test'
import { goTo, openWorkspace, scrollContentTo, sectionNav, SECTIONS } from './support'

test('every section opens from the nav and is marked as the current one', async ({ page }) => {
  await openWorkspace(page)

  for (const section of SECTIONS) {
    await goTo(page, section)
    await expect(
      sectionNav(page).getByRole('button', { name: section, exact: true }),
    ).toHaveAttribute('aria-current', 'page')
  }
})

test('the Leads badge shows the same waiting count as the Overview and the queue', async ({
  page,
}) => {
  await openWorkspace(page)
  const waitingHeading = await page
    .getByRole('heading', { name: /applications? waiting/ })
    .textContent()
  const waiting = Number(/(\d+)/.exec(waitingHeading ?? '')?.[1])

  expect(waiting).toBeGreaterThan(0)
  await expect(
    sectionNav(page).getByRole('button', { name: 'Leads', exact: true }),
  ).toHaveAccessibleDescription(`${waiting} waiting`)

  await goTo(page, 'Leads')
  await expect(page.getByRole('main').getByText(new RegExp(`^${waiting} waiting`))).toBeVisible()
})

test('Start reviewing on the Overview opens the queue', async ({ page }) => {
  await openWorkspace(page)

  await page.getByRole('button', { name: 'Start reviewing' }).click()

  await expect(page.getByRole('heading', { name: 'Applications', level: 2 })).toBeVisible()
})

test('a newly chosen section opens at its top', async ({ page }) => {
  await openWorkspace(page)
  await goTo(page, 'Members')
  await scrollContentTo(page, 'bottom')

  await goTo(page, 'Leads')

  await expect.poll(() => page.evaluate(() => document.querySelector('main')?.scrollTop)).toBe(0)
})

test('the account menu opens, names the spreadsheet and closes on Escape', async ({ page }) => {
  await openWorkspace(page)

  await page.getByRole('button', { name: 'Account' }).click()
  const menu = page.getByRole('group', { name: 'Account' })

  await expect(menu.getByText('E2E HARNESS')).toBeVisible()
  await expect(menu.getByRole('button', { name: /turn on face id lock/i })).toBeVisible()
  await expect(menu.getByRole('button', { name: 'Sign out' })).toBeVisible()
  await expect(menu).toBeInViewport({ ratio: 1 })

  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
})
