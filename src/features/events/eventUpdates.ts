import type { CommunityEvent } from './communityEvent'

export const replaceEvent = ({
  events,
  updatedEvent,
}: {
  events: readonly CommunityEvent[]
  updatedEvent: CommunityEvent
}): readonly CommunityEvent[] =>
  events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))

export const appendEvent = ({
  events,
  newEvent,
}: {
  events: readonly CommunityEvent[]
  newEvent: CommunityEvent
}): readonly CommunityEvent[] => [...events, newEvent]

/* Archiving, never deleting: an event row is what every attendance row points
   at, so removing one would take that person's event history with it. */
export const archiveEvent = ({
  events,
  eventId,
}: {
  events: readonly CommunityEvent[]
  eventId: string
}): readonly CommunityEvent[] =>
  events.map((event) => (event.id === eventId ? { ...event, isArchived: true } : event))
