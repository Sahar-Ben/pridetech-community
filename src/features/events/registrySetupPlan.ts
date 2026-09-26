import { REGISTRY_TAB_DEFINITIONS, type RegistryTabDefinition } from './eventRegistryTabs'
import { buildHeaderMap } from '../../sheets/headerMap'
import { hasAnyRecordedCell } from '../../sheets/readCell'

/* Four states, not two, because the spreadsheet this runs against is two years
   of somebody's hand-maintained work and the organiser has already added tabs
   to it themselves.

   `absent` is the tab this app creates. `empty` is the tab they created and
   left with nothing in it at all: creating it again would fail, and skipping
   it because it exists would leave a tab every later read reports as
   headerless. Emptiness is judged on the whole tab rather than on row 1, so a
   tab whose data starts further down is never given a heading row above it.
   `ready` is touched by nothing. `unusable` is a tab of that name holding
   something else, which is the one state where guessing could destroy work:
   rewriting a heading somebody typed would orphan the column of data under it,
   so it is reported and nothing is written. */
export type RegistryTabPlan =
  | { tabName: string; state: 'absent' }
  | { tabName: string; state: 'empty' }
  | { tabName: string; state: 'ready' }
  | { tabName: string; state: 'unusable'; reason: string }

export type RegistryTabPlans = readonly RegistryTabPlan[]

const findExistingTabName = ({
  tabName,
  existingTabNames,
}: {
  tabName: string
  existingTabNames: readonly string[]
}): string | undefined =>
  existingTabNames.find((existing) => existing.toLowerCase() === tabName.toLowerCase())

const findMissingHeadings = ({
  definition,
  headerRow,
}: {
  definition: RegistryTabDefinition
  headerRow: readonly string[]
}): readonly string[] => {
  const headerMap = buildHeaderMap(headerRow)
  return definition.requiredHeadings.filter(
    (heading) => !headerMap.has(heading.trim().toLowerCase()),
  )
}

const planTab = ({
  definition,
  existingTabNames,
  rowsByTabName,
}: {
  definition: RegistryTabDefinition
  existingTabNames: readonly string[]
  rowsByTabName: ReadonlyMap<string, readonly (readonly string[])[]>
}): RegistryTabPlan => {
  const { tabName } = definition
  const existingTabName = findExistingTabName({ tabName, existingTabNames })

  if (existingTabName === undefined) {
    return { tabName, state: 'absent' }
  }

  /* Two tabs whose names differ only in case are two different tabs to every
     range this app builds, and Google will refuse to create the second. Saying
     which spelling is in the way beats a refusal nobody can act on. */
  if (existingTabName !== tabName) {
    return {
      tabName,
      state: 'unusable',
      reason: `A tab named ${existingTabName} is already there, and this app addresses the tab named ${tabName}. Rename it to ${tabName}, or move it aside, then reload.`,
    }
  }

  const rows = rowsByTabName.get(tabName) ?? []
  if (!rows.some(hasAnyRecordedCell)) {
    return { tabName, state: 'empty' }
  }

  const missingHeadings = findMissingHeadings({ definition, headerRow: rows[0] ?? [] })
  if (missingHeadings.length > 0) {
    return {
      tabName,
      state: 'unusable',
      reason: `The ${tabName} tab already holds a heading row, and it has no column headed ${missingHeadings.join(' or ')}. Nothing here has been changed: add the heading yourself, or move this tab aside, then reload.`,
    }
  }

  return { tabName, state: 'ready' }
}

export const planRegistrySetup = ({
  existingTabNames,
  rowsByTabName,
}: {
  existingTabNames: readonly string[]
  rowsByTabName: ReadonlyMap<string, readonly (readonly string[])[]>
}): RegistryTabPlans =>
  REGISTRY_TAB_DEFINITIONS.map((definition) =>
    planTab({ definition, existingTabNames, rowsByTabName }),
  )

export const findRegistryTabPlan = ({
  plans,
  tabName,
}: {
  plans: RegistryTabPlans
  tabName: string
}): RegistryTabPlan => {
  const plan = plans.find((candidate) => candidate.tabName === tabName)
  if (plan === undefined) {
    throw new Error(`no registry tab is planned for ${tabName}`)
  }
  return plan
}

export const selectTabsToCreate = (plans: RegistryTabPlans): readonly string[] =>
  plans.flatMap((plan) => (plan.state === 'absent' ? [plan.tabName] : []))

/* A tab this app creates and a tab the organiser created and left empty both
   need the same thing written into row 1, and neither has a cell holding
   anything to lose. */
export const selectTabsNeedingHeadings = (plans: RegistryTabPlans): readonly string[] =>
  plans.flatMap((plan) =>
    plan.state === 'absent' || plan.state === 'empty' ? [plan.tabName] : [],
  )

export const selectUnusableTabs = (
  plans: RegistryTabPlans,
): readonly Extract<RegistryTabPlan, { state: 'unusable' }>[] =>
  plans.flatMap((plan) => (plan.state === 'unusable' ? [plan] : []))

export const isRegistryReady = (plans: RegistryTabPlans): boolean =>
  plans.every((plan) => plan.state === 'ready')

/* One unusable tab stops the whole setup rather than only its own tab: the
   three tabs are one record between them, and half a registry is a screen that
   reads events it can never attach a response sheet to. */
export const canRegistryBeSetUp = (plans: RegistryTabPlans): boolean =>
  selectUnusableTabs(plans).length === 0 && selectTabsNeedingHeadings(plans).length > 0
