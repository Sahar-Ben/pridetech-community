import { expect, type Page } from '@playwright/test'

export const SECTIONS = ['Overview', 'Leads', 'Members', 'Events'] as const

export type SectionName = (typeof SECTIONS)[number]

export const isPhone = (page: Page): boolean => (page.viewportSize()?.width ?? 1280) < 768

/* Opens the harness and waits for the Overview, which reads both tabs, so
   every test starts from a workspace that has finished loading. Console errors
   are collected for the test to assert on. */
export const openWorkspace = async (page: Page): Promise<{ consoleErrors: string[] }> => {
  const consoleErrors: string[] = []
  page.on('pageerror', (error) => consoleErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Overview', level: 2 })).toBeVisible()
  await expect(page.getByRole('heading', { name: /applications? waiting/ })).toBeVisible()
  return { consoleErrors }
}

export const sectionNav = (page: Page) => page.getByRole('navigation', { name: 'Sections' })

const SECTION_HEADINGS: Readonly<Record<SectionName, string>> = {
  Overview: 'Overview',
  Leads: 'Applications',
  Members: 'Members',
  Events: 'Events',
}

export const goTo = async (page: Page, section: SectionName): Promise<void> => {
  await sectionNav(page).getByRole('button', { name: section, exact: true }).click()
  await expect(
    page.getByRole('heading', { name: SECTION_HEADINGS[section], level: 2 }),
  ).toBeVisible()
  /* The lists are read asynchronously after the heading appears. */
  if (section === 'Leads') {
    await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible()
  }
  if (section === 'Members') {
    await expect(page.getByRole('table', { name: 'Members' })).toBeVisible()
  }
}

/* How far content reaches past the right edge of the scrolling area and of
   the window. `scrollWidth` counts content even where overflow is hidden, so
   this catches a too-wide element that the clipping would hide from a user. */
export const horizontalOverflow = async (page: Page): Promise<{ main: number; document: number }> =>
  page.evaluate(() => {
    const main = document.querySelector('main')
    return {
      main: main === null ? 0 : main.scrollWidth - main.clientWidth,
      document: document.documentElement.scrollWidth - window.innerWidth,
    }
  })

/* The offending elements, for a failure message a person can act on. */
export const describeOverflow = async (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const main = document.querySelector('main')
    if (main === null) {
      return []
    }
    const limit = main.getBoundingClientRect().right + 1
    const wide = [...main.querySelectorAll<HTMLElement>('*')].filter((element) => {
      if (element.scrollWidth > element.clientWidth + 1) {
        const overflowX = getComputedStyle(element).overflowX
        if (overflowX === 'visible') {
          return true
        }
      }
      return (
        element.getBoundingClientRect().right > limit &&
        element.closest('[class*="overflow-x-auto"]') === null
      )
    })
    return wide
      .filter((element) => !wide.some((other) => other !== element && element.contains(other)))
      .slice(0, 5)
      .map(
        (element) =>
          `<${element.tagName.toLowerCase()} class="${element.className}"> ${element.textContent?.slice(0, 60) ?? ''}`,
      )
  })

export const expectNoHorizontalOverflow = async (page: Page, where: string): Promise<void> => {
  const overflow = await horizontalOverflow(page)
  const details = overflow.main > 0 || overflow.document > 0 ? await describeOverflow(page) : []
  expect(overflow, `${where} is wider than the screen:\n${details.join('\n')}`).toEqual({
    main: 0,
    document: 0,
  })
}

export const scrollContentTo = async (page: Page, position: 'top' | 'bottom'): Promise<void> => {
  await page.evaluate((target) => {
    const main = document.querySelector('main')
    if (main !== null) {
      main.scrollTop = target === 'top' ? 0 : main.scrollHeight
    }
  }, position)
}
