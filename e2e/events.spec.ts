import { expect, test } from '@playwright/test'
import { goTo, openWorkspace } from './support'

test.beforeEach(async ({ page }) => {
  await openWorkspace(page)
  await goTo(page, 'Events')
})

test('upcoming and past events are listed', async ({ page }) => {
  await expect(page.getByText('Upcoming', { exact: true })).toBeVisible()
  await expect(page.getByText('Past', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Pride Month Panel' })).toBeVisible()
})

test('an event opens and goes back', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Moabet' }).click()

  await expect(page.getByRole('heading', { name: 'Moabet' })).toBeVisible()
  await page.getByRole('button', { name: /back to events/i }).click()
  await expect(page.getByRole('button', { name: 'Open Moabet' })).toBeVisible()
})

test('closing out asks first, says what it will do, and can be reopened', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Pride Month Panel' }).click()
  await page.getByRole('button', { name: 'Close out attendance' }).click()

  const dialog = page.getByRole('dialog', { name: /close out pride month panel/i })
  await expect(dialog).toBeVisible()
  await expect(dialog).toBeInViewport({ ratio: 1 })
  await expect(dialog.getByRole('button', { name: 'Not yet' })).toBeFocused()

  await dialog.getByRole('button', { name: 'Not yet' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Close out attendance' })).toBeVisible()

  await page.getByRole('button', { name: 'Close out attendance' }).click()
  await dialog.getByRole('button', { name: 'Close out', exact: true }).click()

  await expect(page.getByText(/closed out\. this is the final attendance/i)).toBeVisible()
  await page.getByRole('button', { name: 'Reopen check-in' }).click()
  await expect(page.getByRole('button', { name: 'Close out attendance' })).toBeVisible()
})

test('an event that has not happened yet offers check-in but not close-out', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Moabet' }).click()

  await expect(page.getByRole('button', { name: 'Check in at the door' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close out attendance' })).toHaveCount(0)
})

test('a new event opens straight onto its page with attaching its sheet next', async ({ page }) => {
  await page.getByRole('button', { name: 'Add event' }).click()
  await page.getByLabel(/^name/i).fill('Board Games Night')
  await page.getByLabel(/^date/i).fill('2026-11-20')
  await page.getByLabel(/^location/i).fill('Haifa')
  await page.getByRole('button', { name: 'Save event' }).click()

  await expect(page.getByRole('heading', { name: 'Board Games Night' })).toBeVisible()
  await expect(page.getByText(/next, attach its response sheet/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Attach a response sheet' })).toBeVisible()
})

test('an event can be edited from its own page and comes back to it', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Pride Month Panel' }).click()
  await page.getByRole('button', { name: 'Edit event' }).click()
  await page.getByRole('button', { name: 'Save event' }).click()

  await expect(page.getByRole('heading', { name: 'Pride Month Panel' })).toBeVisible()
  await expect(page.getByText(/pride month panel was saved/i)).toBeVisible()
})
