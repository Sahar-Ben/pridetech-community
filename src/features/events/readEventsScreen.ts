import { loadEventRegistry, type EventRegistry } from './loadEventRegistry'
import { loadMembers } from '../members/loadMembers'
import type { Member } from '../members/member'
import { readRegistrySetupPlan } from './registrySetup'
import {
  canRegistryBeSetUp,
  selectUnusableTabs,
  type RegistryTabPlans,
} from './registrySetupPlan'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* Three things the Events screen can be looking at, and the order they are
   asked in is the order they matter. A tab holding somebody else's work stops
   everything, because the alternative is offering to write into it. A registry
   that is not there yet is a question for the organiser rather than an error.
   Only once neither is true is there an events list to read. */
export type EventsScreenData =
  | { kind: 'blocked'; plans: RegistryTabPlans }
  | { kind: 'setup-needed'; plans: RegistryTabPlans }
  | { kind: 'ready'; registry: EventRegistry; members: readonly Member[] }

export const readEventsScreen = async ({
  sheetsClient,
}: {
  sheetsClient: SheetsClient
}): Promise<EventsScreenData> => {
  const plans = await readRegistrySetupPlan({ sheetsClient })

  if (selectUnusableTabs(plans).length > 0) {
    return { kind: 'blocked', plans }
  }
  if (canRegistryBeSetUp(plans)) {
    return { kind: 'setup-needed', plans }
  }
  /* The community is read alongside the registry rather than left as sample
     people: the door screen searches it to admit a walk-in, and a search that
     offered invented names at a real door is the failure this section is most
     able to cause. */
  const [registry, members] = await Promise.all([
    loadEventRegistry({ sheetsClient }),
    loadMembers({ sheetsClient }),
  ])
  return { kind: 'ready', registry, members }
}
