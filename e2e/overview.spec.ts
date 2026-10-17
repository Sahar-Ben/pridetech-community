import { expect, test } from '@playwright/test'
import { goTo, openWorkspace, sectionNav } from './support'

test.beforeEach(async ({ page }) => {
  await openWorkspace(page)
})

const eventBars = (page: import('@playwright/test').Page) =>
  page.getByRole('list', { name: 'Active members by events attended' })

const eventsFilter = (page: import('@playwright/test').Page) =>
  page.getByRole('group', { name: 'Events attended' })

test('counts active members by how many events they have been to', async ({ page }) => {
  await expect(eventBars(page).getByRole('button', { name: /^1 event: 1 members/ })).toBeVisible()
  await expect(eventBars(page).getByRole('button', { name: /^No events: \d+ members/ })).toBeVisible()
})

test('a bar opens the Members screen filtered to those members', async ({ page }) => {
  await eventBars(page).getByRole('button', { name: /^1 event/ }).click()

  await expect(page.getByRole('heading', { name: 'Members', level: 2 })).toBeVisible()
  await expect(eventsFilter(page).getByRole('button', { name: /^1 event/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  const rows = page.getByRole('table', { name: 'Members' }).locator('tbody tr')
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toContainText('Twice Applied Member')
  await expect(page.getByRole('button', { name: 'Copy 1 email' })).toBeVisible()
})

test('Members from the navigation starts unfiltered, even after a bar was used', async ({ page }) => {
  await eventBars(page).getByRole('button', { name: /^1 event/ }).click()
  await goTo(page, 'Overview')
  await sectionNav(page).getByRole('button', { name: 'Members', exact: true }).click()

  await expect(eventsFilter(page).getByRole('button', { name: 'All events' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('the bars are big enough for a thumb', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1280) >= 768, 'touch target sizes are a phone concern')
  await expect(eventBars(page).getByRole('button').first()).toBeVisible()

  for (const bar of await eventBars(page).getByRole('button').all()) {
    const box = await bar.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  }
})
