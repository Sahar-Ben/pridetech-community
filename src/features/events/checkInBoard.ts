import { filterRegistrantsForCheckIn } from './checkInSearch'
import { sortRegistrantsByName } from './eventRegistrants'
import { hasRegistrantArrived, type ArrivedRegistrant, type Registrant } from './registrant'

export const CHECK_IN_TABS = ['pending', 'arrived'] as const

export type CheckInTab = (typeof CHECK_IN_TABS)[number]

/* What the door is told when the tab it is looking at has nobody in it.
   `matched-on-other-tab` is kept apart from `no-match` on purpose: "I cannot
   find them" and "they are already in" are different answers to the person at
   the front of the queue, and collapsing them stops the queue. */
export type CheckInEmptyState =
  | { kind: 'empty-tab' }
  | { kind: 'no-match' }
  | { kind: 'matched-on-other-tab'; matches: readonly Registrant[] }

export type CheckInBoard = {
  pendingCount: number
  arrivedCount: number
  visibleRegistrants: readonly Registrant[]
  emptyState: CheckInEmptyState | undefined
}

const selectPending = (registrants: readonly Registrant[]): readonly Registrant[] =>
  sortRegistrantsByName(registrants.filter((registrant) => !hasRegistrantArrived(registrant)))

/* Most recent first: the arrived tab is opened to undo a mis-tap, and the
   mis-tap is always the last one made. */
const selectArrived = (registrants: readonly Registrant[]): readonly ArrivedRegistrant[] =>
  registrants
    .filter(hasRegistrantArrived)
    .toSorted((earlier, later) => later.checkedInAt.localeCompare(earlier.checkedInAt))

const findEmptyState = ({
  visibleRegistrants,
  otherTabRegistrants,
  searchText,
}: {
  visibleRegistrants: readonly Registrant[]
  otherTabRegistrants: readonly Registrant[]
  searchText: string
}): CheckInEmptyState | undefined => {
  if (visibleRegistrants.length > 0) {
    return undefined
  }
  if (searchText.trim() === '') {
    return { kind: 'empty-tab' }
  }
  const matches = filterRegistrantsForCheckIn({ registrants: otherTabRegistrants, searchText })
  if (matches.length === 0) {
    return { kind: 'no-match' }
  }
  return { kind: 'matched-on-other-tab', matches }
}

export const buildCheckInBoard = ({
  registrants,
  searchText,
  activeTab,
}: {
  registrants: readonly Registrant[]
  searchText: string
  activeTab: CheckInTab
}): CheckInBoard => {
  const pending = selectPending(registrants)
  const arrived = selectArrived(registrants)
  const isPendingShowing = activeTab === 'pending'
  const activeTabRegistrants = isPendingShowing ? pending : arrived
  const otherTabRegistrants = isPendingShowing ? arrived : pending
  const visibleRegistrants = filterRegistrantsForCheckIn({
    registrants: activeTabRegistrants,
    searchText,
  })

  return {
    pendingCount: pending.length,
    arrivedCount: arrived.length,
    visibleRegistrants,
    emptyState: findEmptyState({ visibleRegistrants, otherTabRegistrants, searchText }),
  }
}

export const otherCheckInTab = (tab: CheckInTab): CheckInTab =>
  tab === 'pending' ? 'arrived' : 'pending'

const ARROW_KEYS = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']

export const findTabForArrowKey = ({
  key,
  activeTab,
}: {
  key: string
  activeTab: CheckInTab
}): CheckInTab | undefined => {
  if (ARROW_KEYS.includes(key)) {
    return otherCheckInTab(activeTab)
  }
  if (key === 'Home') {
    return 'pending'
  }
  if (key === 'End') {
    return 'arrived'
  }
  return undefined
}

export const toTabButtonId = ({ baseId, tab }: { baseId: string; tab: CheckInTab }): string =>
  `${baseId}-${tab}`
