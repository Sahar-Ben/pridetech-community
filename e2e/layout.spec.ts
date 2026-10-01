import { expect, test } from '@playwright/test'
import {
  expectNoHorizontalOverflow,
  goTo,
  isPhone,
  openWorkspace,
  scrollContentTo,
  SECTIONS,
} from './support'

/* The layout promises every screen makes, checked on every screen at every
   width. These are the bugs that were found by hand on a phone: a list that
   slid sideways, and a header and nav that drifted up the screen. */

test.describe('every section fits the screen', () => {
  for (const section of SECTIONS) {
    test(`${section} is never wider than the screen`, async ({ page }) => {
      await openWorkspace(page)
      await goTo(page, section)

      await expectNoHorizontalOverflow(page, section)
      await scrollContentTo(page, 'bottom')
      await expectNoHorizontalOverflow(page, `${section}, scrolled to the end`)
    })
  }
})

test.describe('the header and nav stay where they belong', () => {
  for (const section of SECTIONS) {
    test(`${section}: header at the top and nav on screen after scrolling to the end and back`, async ({
      page,
    }) => {
      await openWorkspace(page)
      await goTo(page, section)
      const viewport = page.viewportSize()
      if (viewport === null) {
        throw new Error('the test needs a viewport')
      }

      for (const position of ['bottom', 'top', 'bottom'] as const) {
        await scrollContentTo(page, position)

        const header = await page.locator('header').first().boundingBox()
        const nav = await page.getByRole('navigation', { name: 'Sections' }).boundingBox()
        expect(header?.y, `header after scrolling to the ${position}`).toBe(0)
        expect(nav, 'the nav is rendered').not.toBeNull()
        if (nav !== null && isPhone(page)) {
          /* Floating near the bottom edge on a phone, never halfway up. */
          expect(nav.y + nav.height).toBeGreaterThan(viewport.height - 60)
          expect(nav.y + nav.height).toBeLessThanOrEqual(viewport.height)
        }
      }
    })
  }

  test('the page itself never scrolls, only the content area does', async ({ page }) => {
    await openWorkspace(page)
    await goTo(page, 'Members')

    const page_ = await page.evaluate(() => ({
      pageScrollable: document.documentElement.scrollHeight > window.innerHeight + 1,
      contentScrollable: (document.querySelector('main')?.scrollHeight ?? 0) > window.innerHeight,
    }))

    expect(page_).toEqual({ pageScrollable: false, contentScrollable: true })
  })

  test('the window is put back if it is panned, as iOS does when the keyboard closes', async ({
    page,
  }) => {
    await openWorkspace(page)
    await goTo(page, 'Leads')
    const search = page.getByRole('searchbox', { name: 'Search applications' })

    await search.focus()
    await page.evaluate(() => window.scrollTo(0, 300))
    await search.blur()

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  })
})

test.describe('screens opened on top of a section fit the screen too', () => {
  test('a member with a very long name, company and address', async ({ page }) => {
    await openWorkspace(page)
    await goTo(page, 'Members')
    await page.getByRole('button', { name: /^Alexandria-Konstantina/ }).click()

    await expect(page.getByRole('button', { name: /back to members/i })).toBeVisible()
    await expectNoHorizontalOverflow(page, 'the member detail')
  })

  test('an event with a very long name and location', async ({ page }) => {
    await openWorkspace(page)
    await goTo(page, 'Events')
    await page.getByRole('button', { name: /^Open An Extremely Long Event Name/ }).click()

    await expect(page.getByRole('button', { name: /back to events/i })).toBeVisible()
    await expectNoHorizontalOverflow(page, 'the event detail')
  })

  test('the sort and filter sheet sits inside the screen', async ({ page }) => {
    await openWorkspace(page)
    await goTo(page, 'Leads')
    await page.getByRole('button', { name: /sort & filter/i }).click()

    const sheet = page.getByRole('dialog', { name: 'Sort & filter' })
    await expect(sheet).toBeVisible()
    const box = await sheet.boundingBox()
    const viewport = page.viewportSize()
    expect(box).not.toBeNull()
    if (box !== null && viewport !== null) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
    }
    /* Its footer button is reachable without scrolling the sheet. */
    await expect(sheet.getByRole('button', { name: /^show \d+ applications?$/i })).toBeInViewport()
  })

  test('the decline dialog sits inside the screen', async ({ page }) => {
    await openWorkspace(page)
    await goTo(page, 'Leads')
    await page.getByRole('button', { name: 'Decline' }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toBeInViewport({ ratio: 1 })
  })
})
