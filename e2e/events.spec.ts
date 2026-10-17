import { expect, test, type Page } from '@playwright/test'
import { goTo, isPhone, openWorkspace } from './support'
import { GROW_HEBREW_TYPE, GROW_RECRUITING, GROW_SEEKING } from './harness/attendeeTypeCases'

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

test.describe('an event whose form asks which kind of guest each person is', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole('button', { name: 'Open Grow Careers Evening' }).click()
    await expect(page.getByRole('table', { name: 'Registrants' })).toBeVisible()
  })

  const attendeeTypes = (page: Page) => page.getByRole('group', { name: 'Attendee type' })

  const registrantRows = (page: Page) =>
    page.getByRole('table', { name: 'Registrants' }).locator('tbody tr')

  test('counts each answer, with the blank ones as a group of their own', async ({ page }) => {
    const chips = attendeeTypes(page)

    await expect(chips.getByRole('button', { name: 'All 6' })).toHaveAttribute('aria-pressed', 'true')
    await expect(chips.getByRole('button', { name: `${GROW_SEEKING} 2` })).toBeVisible()
    await expect(chips.getByRole('button', { name: `${GROW_RECRUITING} 1` })).toBeVisible()
    await expect(chips.getByRole('button', { name: `${GROW_HEBREW_TYPE} 1` })).toBeVisible()
    await expect(chips.getByRole('button', { name: 'No answer 1' })).toBeVisible()
  })

  test('shows only the people who gave the chosen answer', async ({ page }) => {
    await attendeeTypes(page).getByRole('button', { name: `${GROW_RECRUITING} 1` }).click()

    await expect(registrantRows(page)).toHaveCount(1)
    await expect(registrantRows(page).first()).toContainText('Grow Recruiter')

    await attendeeTypes(page).getByRole('button', { name: 'All 6' }).click()
    await expect(registrantRows(page)).toHaveCount(6)
  })

  test('says each person\'s answer on their row and at the door', async ({ page }) => {
    await expect(registrantRows(page).filter({ hasText: 'Grow Recruiter' })).toContainText(
      GROW_RECRUITING,
    )

    await page.getByRole('button', { name: 'Check in at the door' }).click()
    await expect(page.getByRole('button', { name: /Grow Recruiter/ })).toContainText(GROW_RECRUITING)
  })

  test('the answer chips are big enough for a thumb', async ({ page }) => {
    test.skip(!isPhone(page), 'touch target sizes are a phone concern')

    for (const chip of await attendeeTypes(page).getByRole('button').all()) {
      const box = await chip.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
    }
  })

  test('the columns of an attached sheet can be changed, starting from what is recorded', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /^change columns for/i }).click()

    await expect(page.getByLabel('Attendee type column')).toHaveValue('3')
    await page.getByLabel('Attendee type column').selectOption({ label: 'Not on this sheet' })
    await page.getByRole('button', { name: 'Save columns' }).click()

    await expect(page.getByText(/columns mapped, including an email column\.$/i)).toBeVisible()
    await expect(attendeeTypes(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^change columns for/i })).toHaveCount(1)
  })
})
