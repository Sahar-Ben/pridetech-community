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
