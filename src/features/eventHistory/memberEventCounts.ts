import type { CommunityEventHistory } from './loadCommunityEventHistory'
import { statusAt, type MemberEventStatus } from './memberEventHistory'
import { resolveRegistrantLink } from '../events/registrantLink'
import type { Member } from '../members/member'

/* What counts as having been to an event, for deciding who to reach out to:
   holding a place, whether they came, are coming, or came before the app kept
   attendance. A waiting-list entry never held a place and a no-show had one and
   did not use it, so neither is an event they have been part of. */
const COUNTED_STATUSES: ReadonlySet<MemberEventStatus> = new Set([
  'attended',
  'registered',
  'not-recorded',
])

/* Row number to how many events each member has been part of, for the whole
   community at once. Each registrant is resolved to a member the way the
   event's own list and the member's profile resolve them, once per event, so a
   person who filled the form in twice is still one event. A member on no event
   is absent from the map, which reads as zero. */
export const countEventsByMember = ({
  members,
  history,
  today,
}: {
  members: readonly Member[]
  history: CommunityEventHistory
  today: string
}): ReadonlyMap<number, number> => {
  const counts = new Map<number, number>()

  history.events.forEach((event) => {
    const eventRegistrants = history.registrants.filter(
      (registrant) => registrant.eventId === event.id,
    )
    const countedHere = new Set<number>()
    eventRegistrants.forEach((registrant) => {
      const link = resolveRegistrantLink({ registrant, members, eventRegistrants })
      if (link.kind !== 'member' && link.kind !== 'member-by-name') {
        return
      }
      if (!COUNTED_STATUSES.has(statusAt({ registrant, event, today }))) {
        return
      }
      countedHere.add(link.rowNumber)
    })
    countedHere.forEach((rowNumber) => {
      counts.set(rowNumber, (counts.get(rowNumber) ?? 0) + 1)
    })
  })

  return counts
}

export const EVENT_COUNT_FILTERS = ['any', 'none', 'one', 'two', 'three-or-more'] as const

export type EventCountFilter = (typeof EVENT_COUNT_FILTERS)[number]

export const EVENT_COUNT_FILTER_LABELS: Readonly<Record<EventCountFilter, string>> = {
  any: 'All events',
  none: 'No events',
  one: '1 event',
  two: '2 events',
  'three-or-more': '3+ events',
}

export const doesEventCountMatch = ({
  count,
  filter,
}: {
  count: number
  filter: EventCountFilter
}): boolean => {
  if (filter === 'any') {
    return true
  }
  if (filter === 'none') {
    return count === 0
  }
  if (filter === 'one') {
    return count === 1
  }
  if (filter === 'two') {
    return count === 2
  }
  return count >= 3
}
