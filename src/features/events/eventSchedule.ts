import type { CommunityEvent } from './communityEvent'

export type EventSchedule = {
  upcomingEvents: readonly CommunityEvent[]
  pastEvents: readonly CommunityEvent[]
}

/* Dates are held as `YYYY-MM-DD`, so comparing them as text is the calendar
   comparison and no time zone gets a say in which day an event falls on. */
const compareByDateAscending = (earlier: CommunityEvent, later: CommunityEvent): number =>
  earlier.date.localeCompare(later.date)

const compareByDateDescending = (earlier: CommunityEvent, later: CommunityEvent): number =>
  later.date.localeCompare(earlier.date)

export const splitEventsByDate = ({
  events,
  today,
}: {
  events: readonly CommunityEvent[]
  today: string
}): EventSchedule => ({
  upcomingEvents: events.filter((event) => event.date >= today).toSorted(compareByDateAscending),
  pastEvents: events.filter((event) => event.date < today).toSorted(compareByDateDescending),
})

export const selectListedEvents = (events: readonly CommunityEvent[]): readonly CommunityEvent[] =>
  events.filter((event) => !event.isArchived)

export const groupEventsForListing = ({
  events,
  today,
}: {
  events: readonly CommunityEvent[]
  today: string
}): EventSchedule => splitEventsByDate({ events: selectListedEvents(events), today })
