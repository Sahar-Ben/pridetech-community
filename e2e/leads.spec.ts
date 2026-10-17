import { expect, test, type Page } from '@playwright/test'
import { LINKEDIN_CASES } from './harness/linkedInCases'
import { goTo, openWorkspace } from './support'

const cardOf = (page: Page, name: string) =>
  page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name, exact: true, level: 3 }) })

/* The number the Leads badge announces, read from its description. */
const waitingOnBadge = async (page: Page): Promise<number> => {
  const description = await page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('button', { name: 'Leads', exact: true })
    .evaluate((button) => {
      const id = button.getAttribute('aria-describedby')
      return id === null ? '' : (document.getElementById(id)?.textContent ?? '')
    })
  return Number(/(\d+)/.exec(description)?.[1] ?? Number.NaN)
}

const shownNames = async (page: Page): Promise<string[]> =>
  page.getByRole('heading', { level: 3 }).allTextContents()

test.beforeEach(async ({ page }) => {
  await openWorkspace(page)
  await goTo(page, 'Leads')
})

test.describe('the LinkedIn button', () => {
  for (const [index, linkedInCase] of LINKEDIN_CASES.entries()) {
    test(`opens LinkedIn for a cell written as ${JSON.stringify(linkedInCase.cell)}`, async ({
      page,
    }) => {
      const link = cardOf(page, `LinkedIn Case ${index + 1}`).getByRole('link', {
        name: 'LinkedIn',
      })

      await expect(link).toHaveAttribute('href', linkedInCase.opens)
      await expect(link).toHaveAttribute('target', '_blank')
    })
  }

  test('says the cell needs checking when it holds text but no address', async ({ page }) => {
    const card = page
      .getByRole('listitem')
      .filter({ hasText: 'will send it later' })
      .or(page.getByRole('listitem').filter({ has: page.getByText('Check LinkedIn') }))

    await expect(card.first().getByText('Check LinkedIn')).toBeVisible()
  })

  test('never links anywhere inside this app', async ({ page }) => {
    const hrefs = await page
      .getByRole('link', { name: 'LinkedIn' })
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))

    expect(hrefs.length).toBeGreaterThan(5)
    for (const href of hrefs) {
      expect(href).toMatch(/^https?:\/\/([a-z0-9-]+\.)*linkedin\.com\//i)
    }
  })
})

test('Email and WhatsApp open the mail app and a WhatsApp chat; there is no Call button', async ({
  page,
}) => {
  const card = cardOf(page, 'LinkedIn Case 1')

  await expect(card.getByRole('link', { name: 'Email' })).toHaveAttribute('href', /^mailto:[^\s]+@/)
  await expect(card.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
    'href',
    'https://wa.me/972501234567',
  )
  await expect(card.getByRole('link', { name: 'Call' })).toHaveCount(0)
})

test('the email and phone on a card copy with one tap', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const card = cardOf(page, 'LinkedIn Case 1')

  await card.getByRole('button', { name: 'Copy email' }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
    /^lead\d+@example\.com$/,
  )

  await card.getByRole('button', { name: 'Copy phone' }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('050-123-4567')
})

test.describe('search, sort and filter', () => {
  test('search narrows the cards and says how many of how many are shown', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search applications' }).fill('LinkedIn Case 3')

    expect(await shownNames(page)).toEqual(['LinkedIn Case 3'])
    await expect(page.getByRole('status')).toContainText(/Showing 1 of \d+/i)
  })

  test('a search that matches nothing says so and can be cleared', async ({ page }) => {
    const total = (await shownNames(page)).length
    await page
      .getByRole('searchbox', { name: 'Search applications' })
      .fill('zzzz-no-such-applicant')

    await expect(
      page.getByText('No applications match this search and these filters.'),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Clear all' }).first().click()
    await expect.poll(async () => (await shownNames(page)).length).toBe(total)
  })

  test('sorting by name puts the cards in alphabetical order', async ({ page }) => {
    await page.getByRole('button', { name: /sort & filter/i }).click()
    const sheet = page.getByRole('dialog', { name: 'Sort & filter' })
    await sheet.getByText('Name A–Z').click()
    await sheet.getByRole('button', { name: /^show \d+ applications?$/i }).click()

    const names = await shownNames(page)
    const sorted = names.toSorted((first, second) =>
      first.localeCompare(second, undefined, { sensitivity: 'base' }),
    )
    expect(names).toEqual(sorted)
  })

  test('a city filter shows only that city and can be removed from its chip', async ({ page }) => {
    const total = (await shownNames(page)).length
    await page.getByRole('button', { name: /sort & filter/i }).click()
    const sheet = page.getByRole('dialog', { name: 'Sort & filter' })
    await sheet.getByRole('button', { name: /^Haifa/ }).click()
    await page.keyboard.press('Escape')

    const cards = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { level: 3 }) })
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(total)
    for (const card of await cards.all()) {
      await expect(card.getByRole('list', { name: 'City and interests' })).toContainText('Haifa')
    }

    await page.getByRole('button', { name: 'Remove Haifa' }).click()
    await expect.poll(async () => (await shownNames(page)).length).toBe(total)
  })

  test('No LinkedIn shows only applicants the card cannot link to', async ({ page }) => {
    await page.getByRole('button', { name: /sort & filter/i }).click()
    await page.getByRole('dialog').getByText('No LinkedIn', { exact: true }).click()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('main').getByRole('link', { name: 'LinkedIn' })).toHaveCount(0)
    expect((await shownNames(page)).length).toBeGreaterThan(0)
  })
})

test.describe('deciding', () => {
  test('approving takes the card out of the queue and counts the badge down', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Sections' })
    const leadsButton = nav.getByRole('button', { name: 'Leads', exact: true })
    const before = await waitingOnBadge(page)
    const card = cardOf(page, 'LinkedIn Case 2')

    await card.getByRole('radio', { name: 'F' }).check({ force: true })
    await card.getByRole('button', { name: 'Approve' }).click()

    await expect(cardOf(page, 'LinkedIn Case 2')).toHaveCount(0)
    await expect(leadsButton).toHaveAccessibleDescription(`${before - 1} waiting`)
  })

  test('declining asks for a reason and moves the card to Declined', async ({ page }) => {
    const card = cardOf(page, 'LinkedIn Case 4')

    await card.getByRole('button', { name: 'Decline' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog
      .getByRole('button', { name: 'Decline, no reason' })
      .first()
      .click()

    await expect(cardOf(page, 'LinkedIn Case 4')).toHaveCount(0)
    /* The Declined list is the sheet as last read, so it shows the decision
       once the applications are read again. */
    await page.getByRole('button', { name: 'Reload applications' }).click()
    await page.getByRole('tab', { name: /declined/i }).click()
    await expect(cardOf(page, 'LinkedIn Case 4')).toBeVisible()
  })

  test('the gender switch starts undecided and takes a choice', async ({ page }) => {
    const card = cardOf(page, 'LinkedIn Case 5')

    await expect(card.getByRole('radio', { name: 'Unknown' })).toBeChecked()
    await card.getByText('M', { exact: true }).click()
    await expect(card.getByRole('radio', { name: 'M' })).toBeChecked()
  })
})

test('approving says who was approved once their card has gone', async ({ page }) => {
  const firstName = (await shownNames(page))[0] ?? ''
  await cardOf(page, firstName).getByRole('button', { name: 'Approve' }).click()

  const confirmation = page.getByRole('status').filter({ hasText: 'was approved' })
  await expect(confirmation).toHaveText(new RegExp(`${firstName} was approved and added to Members`))
  await expect(confirmation).toBeInViewport({ ratio: 1 })
  await expect(cardOf(page, firstName)).toHaveCount(0)

  await confirmation.getByRole('button', { name: 'Dismiss' }).click()
  await expect(confirmation).toHaveCount(0)
})

test('the decline dialog names its decisions and its chips fit a thumb', async ({ page }) => {
  const firstName = (await shownNames(page))[0] ?? ''
  await cardOf(page, firstName).getByRole('button', { name: 'Decline' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Decline, no reason' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Decline with reason' })).toBeDisabled()
  await expect(dialog).toBeInViewport({ ratio: 1 })

  await dialog.getByRole('button', { name: 'Not in Tech' }).click()
  await expect(dialog.getByRole('button', { name: 'Decline with reason' })).toBeEnabled()

  for (const target of await dialog.getByRole('button').all()) {
    const box = await target.boundingBox()
    expect(box?.height ?? 0, (await target.textContent()) ?? '').toBeGreaterThanOrEqual(44)
  }

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(cardOf(page, firstName)).toHaveCount(1)
})

test.describe('folding a repeat application into one', () => {
  const openRepeats = async (page: Page) => {
    await page.getByRole('button', { name: /on more than one application/ }).click()
  }

  const markButton = (page: Page) =>
    page.getByRole('button', {
      name: 'Mark the later applications from twice@example.com as duplicates',
    })

  test('asks first, saying which row stays and which is marked', async ({ page }) => {
    await openRepeats(page)
    await markButton(page).click()

    const dialog = page.getByRole('dialog', { name: 'Mark 1 row as duplicate?' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toBeInViewport({ ratio: 1 })
    await expect(dialog).toContainText(/Keeps\s+Row \d+/)
    await expect(dialog).toContainText(/Nothing is deleted/)

    await dialog.getByRole('button', { name: 'Not now' }).click()
    await expect(dialog).toBeHidden()
    await expect(markButton(page)).toBeVisible()
  })

  test('marks the later row and takes the address off the list', async ({ page }) => {
    await openRepeats(page)
    await markButton(page).click()
    await page.getByRole('button', { name: 'Mark 1 row', exact: true }).click()

    await expect(page.getByRole('dialog')).toBeHidden()
    /* It was the only repeated address in the harness, so the note about
       repeats goes with it. */
    await expect(page.getByRole('button', { name: /on more than one application/ })).toHaveCount(0)
    await expect(markButton(page)).toHaveCount(0)
  })

  test('the button is big enough for a thumb', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 1280) >= 768, 'touch target sizes are a phone concern')
    await openRepeats(page)

    const box = await markButton(page).boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
  })
})
