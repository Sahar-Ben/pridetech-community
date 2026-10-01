import { expect, test } from '@playwright/test'
import { goTo, isPhone, openWorkspace, SECTIONS, sectionNav } from './support'

/* Checks that hold on every screen whatever was changed: nothing logs an
   error, every link leaves the app properly, every control has a name, and on
   a phone the controls are big enough for a thumb. */

for (const section of SECTIONS) {
  test(`${section}: no errors in the console`, async ({ page }) => {
    const { consoleErrors } = await openWorkspace(page)
    await goTo(page, section)

    expect(consoleErrors).toEqual([])
  })

  test(`${section}: every link is a full address, a mail link or a phone link`, async ({
    page,
  }) => {
    await openWorkspace(page)
    await goTo(page, section)

    const hrefs = await page
      .locator('main a[href]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
    for (const href of hrefs) {
      expect(href, 'a relative link opens a page of this app that does not exist').toMatch(
        /^(https?:\/\/|mailto:|tel:)/,
      )
    }
  })

  test(`${section}: every button and link has a name`, async ({ page }) => {
    await openWorkspace(page)
    await goTo(page, section)

    const unnamed = await page.locator('button:visible, a:visible').evaluateAll((elements) =>
      elements
        .filter((element) => {
          const label =
            element.getAttribute('aria-label') ??
            element.getAttribute('aria-labelledby') ??
            element.textContent?.trim() ??
            ''
          return label === ''
        })
        .map((element) => element.outerHTML.slice(0, 120)),
    )
    expect(unnamed).toEqual([])
  })
}

test('on a phone the nav and the decision buttons are big enough for a thumb', async ({ page }) => {
  test.skip(!isPhone(page), 'touch target sizes are a phone concern')
  await openWorkspace(page)
  await goTo(page, 'Leads')

  const targets = [
    ...(await sectionNav(page).getByRole('button').all()),
    page.getByRole('button', { name: 'Approve' }).first(),
    page.getByRole('button', { name: 'Maybe' }).first(),
    page.getByRole('button', { name: 'Decline' }).first(),
    page.getByRole('link', { name: 'Email' }).first(),
    page.getByRole('link', { name: 'WhatsApp' }).first(),
    page.getByRole('button', { name: 'Copy email' }).first(),
    page.getByRole('button', { name: /sort & filter/i }),
  ]
  for (const target of targets) {
    const box = await target.boundingBox()
    const name = (await target.textContent()) ?? ''
    expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(44)
    expect(box?.width ?? 0, name).toBeGreaterThanOrEqual(44)
  }
})
