import { REGISTRY_TAB_DEFINITIONS } from './eventRegistryTabs'
import { selectTabsNeedingHeadings, type RegistryTabPlans } from './registrySetupPlan'
import { buildCellRange } from '../../sheets/a1Range'
import type { CellWrite } from '../../sheets/sheetsClient'

const headingsOf = (tabName: string): readonly string[] =>
  REGISTRY_TAB_DEFINITIONS.find((definition) => definition.tabName === tabName)?.headings ?? []

/* One cell per heading rather than one span across row 1. A span carries every
   cell between its ends, and the tabs being filled in here were made by hand:
   a stray value a column to the right of the last heading is not this app's to
   erase. */
export const buildRegistryHeadingWrites = (plans: RegistryTabPlans): readonly CellWrite[] =>
  selectTabsNeedingHeadings(plans).flatMap((tabName) =>
    headingsOf(tabName).map((heading, columnIndex) => ({
      range: buildCellRange({ tabName, columnIndex, rowNumber: 1 }),
      value: heading,
    })),
  )
