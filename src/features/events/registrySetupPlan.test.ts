import { describe, expect, it } from 'vitest'
import {
  ATTENDANCE_TAB_NAME,
  EVENTS_TAB_NAME,
  EVENT_SHEETS_TAB_NAME,
  REGISTRY_TAB_DEFINITIONS,
} from './eventRegistryTabs'
import {
  canRegistryBeSetUp,
  findRegistryTabPlan,
  isRegistryReady,
  planRegistrySetup,
  selectTabsNeedingHeadings,
  selectTabsToCreate,
  selectUnusableTabs,
  type RegistryTabPlan,
} from './registrySetupPlan'

const headingsOf = (tabName: string): readonly string[] => {
  const definition = REGISTRY_TAB_DEFINITIONS.find((tab) => tab.tabName === tabName)
  if (definition === undefined) {
    throw new Error(`no registry tab is defined for ${tabName}`)
  }
  return definition.headings
}

const EVERY_REGISTRY_TAB = [EVENTS_TAB_NAME, EVENT_SHEETS_TAB_NAME, ATTENDANCE_TAB_NAME]

type TabRows = Readonly<Record<string, readonly (readonly string[])[]>>

const planWith = ({
  existingTabNames,
  rowsByTabName = {},
}: {
  existingTabNames: readonly string[]
  rowsByTabName?: TabRows
}): readonly RegistryTabPlan[] =>
  planRegistrySetup({
    existingTabNames,
    rowsByTabName: new Map(Object.entries(rowsByTabName)),
  })

const planFor = ({
  tabName,
  existingTabNames,
  rowsByTabName = {},
}: {
  tabName: string
  existingTabNames: readonly string[]
  rowsByTabName?: TabRows
}): RegistryTabPlan =>
  findRegistryTabPlan({ plans: planWith({ existingTabNames, rowsByTabName }), tabName })

const everyTabReady = (): TabRows =>
  Object.fromEntries(EVERY_REGISTRY_TAB.map((tabName) => [tabName, [headingsOf(tabName)]]))

describe('planRegistrySetup, where a tab is not there at all', () => {
  it('should report a missing tab as absent', () => {
    expect(planFor({ tabName: EVENTS_TAB_NAME, existingTabNames: ['Members'] })).toEqual({
      tabName: EVENTS_TAB_NAME,
      state: 'absent',
    })
  })

  it('should list every absent tab as one to create', () => {
    expect(selectTabsToCreate(planWith({ existingTabNames: ['Members', EVENTS_TAB_NAME] }))).toEqual(
      [EVENT_SHEETS_TAB_NAME, ATTENDANCE_TAB_NAME],
    )
  })
})

describe('planRegistrySetup, where a tab was created by hand and left empty', () => {
  it('should report a tab with no rows at all as empty rather than absent', () => {
    expect(
      planFor({ tabName: EVENTS_TAB_NAME, existingTabNames: EVERY_REGISTRY_TAB }),
    ).toEqual({ tabName: EVENTS_TAB_NAME, state: 'empty' })
  })

  it('should treat a tab of blank cells as empty, since a hand-made tab can carry a stray space', () => {
    expect(
      planFor({
        tabName: EVENTS_TAB_NAME,
        existingTabNames: EVERY_REGISTRY_TAB,
        rowsByTabName: { [EVENTS_TAB_NAME]: [['', '  ', '\u{200b}'], []] },
      }),
    ).toEqual({ tabName: EVENTS_TAB_NAME, state: 'empty' })
  })

  it('should not call a tab empty when its rows start below a blank first row', () => {
    const plan = planFor({
      tabName: EVENTS_TAB_NAME,
      existingTabNames: EVERY_REGISTRY_TAB,
      rowsByTabName: { [EVENTS_TAB_NAME]: [[], ['Opening night', '16.4.25']] },
    })

    expect(plan.state).toBe('unusable')
  })

  it('should never plan a heading row above rows that already hold something', () => {
    expect(
      selectTabsNeedingHeadings(
        planWith({
          existingTabNames: EVERY_REGISTRY_TAB,
          rowsByTabName: { [EVENTS_TAB_NAME]: [[], ['Opening night', '16.4.25']] },
        }),
      ),
    ).not.toContain(EVENTS_TAB_NAME)
  })

  it('should not ask for an empty tab to be created again', () => {
    expect(selectTabsToCreate(planWith({ existingTabNames: EVERY_REGISTRY_TAB }))).toEqual([])
  })

  it('should ask for headings on both the tabs it creates and the empty ones it finds', () => {
    expect(
      selectTabsNeedingHeadings(planWith({ existingTabNames: [EVENTS_TAB_NAME] })),
    ).toEqual(EVERY_REGISTRY_TAB)
  })
})

describe('planRegistrySetup, where a tab already holds its headings', () => {
  it('should report a tab whose headings are all there as ready', () => {
    expect(
      planFor({
        tabName: EVENTS_TAB_NAME,
        existingTabNames: EVERY_REGISTRY_TAB,
        rowsByTabName: everyTabReady(),
      }),
    ).toEqual({ tabName: EVENTS_TAB_NAME, state: 'ready' })
  })

  it('should never ask for a heading row over a tab that already has one', () => {
    expect(
      selectTabsNeedingHeadings(
        planWith({ existingTabNames: EVERY_REGISTRY_TAB, rowsByTabName: everyTabReady() }),
      ),
    ).toEqual([])
  })

  it('should read a heading whose spelling differs only in case and spacing as the heading it is', () => {
    expect(
      planFor({
        tabName: EVENT_SHEETS_TAB_NAME,
        existingTabNames: EVERY_REGISTRY_TAB,
        rowsByTabName: {
          [EVENT_SHEETS_TAB_NAME]: [
            ['event id', 'Spreadsheet  ID', 'Sheet name', 'ROLE', 'Column mapping'],
          ],
        },
      }),
    ).toEqual({ tabName: EVENT_SHEETS_TAB_NAME, state: 'ready' })
  })

  it('should call the registry ready only when every tab is', () => {
    expect(
      isRegistryReady(
        planWith({ existingTabNames: EVERY_REGISTRY_TAB, rowsByTabName: everyTabReady() }),
      ),
    ).toBe(true)
    expect(isRegistryReady(planWith({ existingTabNames: EVERY_REGISTRY_TAB }))).toBe(false)
  })
})

describe('planRegistrySetup, where a tab holds something else', () => {
  it('should name the headings a populated tab is missing rather than plan to rewrite them', () => {
    const plan = planFor({
      tabName: EVENTS_TAB_NAME,
      existingTabNames: EVERY_REGISTRY_TAB,
      rowsByTabName: { [EVENTS_TAB_NAME]: [['Event', 'When', 'Where']] },
    })

    expect(plan.state).toBe('unusable')
    expect(plan.state === 'unusable' && plan.reason).toMatch(/Event ID/)
  })

  it('should never plan to write headings over a tab that holds something', () => {
    expect(
      selectTabsNeedingHeadings(
        planWith({
          existingTabNames: EVERY_REGISTRY_TAB,
          rowsByTabName: { [EVENTS_TAB_NAME]: [['Event', 'When', 'Where']] },
        }),
      ),
    ).not.toContain(EVENTS_TAB_NAME)
  })

  it('should refuse to set the registry up at all while any tab is unusable', () => {
    expect(
      canRegistryBeSetUp(
        planWith({
          existingTabNames: EVERY_REGISTRY_TAB,
          rowsByTabName: { [EVENTS_TAB_NAME]: [['Event', 'When', 'Where']] },
        }),
      ),
    ).toBe(false)
  })

  it('should collect the unusable tabs so the organiser is told about all of them at once', () => {
    const unusable = selectUnusableTabs(
      planWith({
        existingTabNames: EVERY_REGISTRY_TAB,
        rowsByTabName: {
          [EVENTS_TAB_NAME]: [['Event']],
          [ATTENDANCE_TAB_NAME]: [['Who came']],
        },
      }),
    )

    expect(unusable.map((plan) => plan.tabName)).toEqual([EVENTS_TAB_NAME, ATTENDANCE_TAB_NAME])
  })

  it('should not accept a tab whose name differs only in case, which would address a different tab', () => {
    const plan = planFor({ tabName: EVENTS_TAB_NAME, existingTabNames: ['events'] })

    expect(plan.state).toBe('unusable')
    expect(plan.state === 'unusable' && plan.reason).toMatch(/events/)
  })

  it('should ignore the headings a tab that does not exist was given', () => {
    expect(
      planFor({
        tabName: EVENTS_TAB_NAME,
        existingTabNames: [],
        rowsByTabName: { [EVENTS_TAB_NAME]: [['Event']] },
      }),
    ).toEqual({ tabName: EVENTS_TAB_NAME, state: 'absent' })
  })
})

describe('canRegistryBeSetUp', () => {
  it('should have nothing to do once every tab is ready', () => {
    expect(
      canRegistryBeSetUp(
        planWith({ existingTabNames: EVERY_REGISTRY_TAB, rowsByTabName: everyTabReady() }),
      ),
    ).toBe(false)
  })

  it('should have work to do when a tab is empty', () => {
    expect(canRegistryBeSetUp(planWith({ existingTabNames: EVERY_REGISTRY_TAB }))).toBe(true)
  })
})
