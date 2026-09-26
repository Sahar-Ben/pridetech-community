import { buildRegistryTabRange, REGISTRY_TAB_DEFINITIONS } from './eventRegistryTabs'
import { buildRegistryHeadingWrites } from './registryHeadingWrites'
import {
  canRegistryBeSetUp,
  planRegistrySetup,
  selectTabsToCreate,
  selectUnusableTabs,
  type RegistryTabPlans,
} from './registrySetupPlan'
import { describeError } from '../../errors/describeError'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError, isForbiddenError } from '../../sheets/sheetsRequestError'

const describeSetupRefusal = (error: unknown): string => {
  if (isForbiddenError(error)) {
    return 'Google refused to add the tabs, and nothing was added: this app is only granted the file you pick with the Google Picker. Use "Change spreadsheet" to pick this spreadsheet again, then try again.'
  }
  return `The tabs could not be added, and nothing was added. ${describeError({ error, fallback: 'Google gave no detail.' })}`
}

/* Only the tabs that are there are read. Asking Google for a range of a tab
   that does not exist is a 400, so a spreadsheet that has never held an event
   would fail its own first look at the registry.

   The whole tab, not only its first row: a tab counts as empty only if there
   is nothing anywhere in it, because a heading row written above somebody's
   data would be a heading row over columns it does not describe. */
const readRegistryRows = async ({
  sheetsClient,
  existingTabNames,
}: {
  sheetsClient: SheetsClient
  existingTabNames: readonly string[]
}): Promise<ReadonlyMap<string, readonly (readonly string[])[]>> => {
  const presentTabNames = REGISTRY_TAB_DEFINITIONS.map((definition) => definition.tabName).filter(
    (tabName) => existingTabNames.includes(tabName),
  )
  const tabRows = await Promise.all(
    presentTabNames.map(
      async (tabName) => await sheetsClient.readRange({ range: buildRegistryTabRange(tabName) }),
    ),
  )
  return new Map(presentTabNames.map((tabName, index) => [tabName, tabRows[index] ?? []]))
}

export const readRegistrySetupPlan = async ({
  sheetsClient,
}: {
  sheetsClient: SheetsClient
}): Promise<RegistryTabPlans> => {
  const existingTabNames = await sheetsClient.readTabNames()
  return planRegistrySetup({
    existingTabNames,
    rowsByTabName: await readRegistryRows({ sheetsClient, existingTabNames }),
  })
}

/* Refusing before the first request rather than after two of three tabs, and
   refusing for a tab the organiser has to look at themselves. The three tabs
   are one record between them: a spreadsheet left with an `Events` tab and no
   `Event sheets` tab is a state nothing in this app can explain later.

   The heading rows all go in one request for the same reason. The whole setup
   is safe to run again, so the recoverable failure is the one that wrote
   nothing. */
export const applyRegistrySetup = async ({
  sheetsClient,
  plans,
}: {
  sheetsClient: SheetsClient
  plans: RegistryTabPlans
}): Promise<void> => {
  const unusableTabs = selectUnusableTabs(plans)
  if (unusableTabs.length > 0) {
    throw new Error(unusableTabs.map((plan) => plan.reason).join(' '))
  }
  /* Doing nothing when there is nothing to do, rather than refusing: this runs
     again after a failure that wrote part of the registry, and the part that
     already landed must not be what stops the rest. */
  if (!canRegistryBeSetUp(plans)) {
    return
  }

  const tabNamesToCreate = selectTabsToCreate(plans)
  if (tabNamesToCreate.length > 0) {
    try {
      await sheetsClient.addTabs({ tabNames: tabNamesToCreate })
    } catch (error: unknown) {
      if (isExpiredSessionError(error)) {
        throw error
      }
      throw new Error(describeSetupRefusal(error))
    }
  }

  /* RAW: these are the exact words every later read looks a column up by, and
     `USER_ENTERED` would hand them to the spreadsheet to interpret. */
  await sheetsClient.updateCells({
    writes: buildRegistryHeadingWrites(plans),
    valueInputOption: 'RAW',
  })
}
