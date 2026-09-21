import type { CommunityEvent } from '../features/events/communityEvent'
import type { Registrant } from '../features/events/registrant'

/* An open event with a plain registrant who has not arrived: the state every
   event is in before its door opens, so a test that forgets a field is
   exercising the un-arrived case rather than a checked-in one. The door policy
   starts open, so a test that says nothing about it gets no members-only
   warning to explain away. */
export const buildEvent = (overrides: Partial<CommunityEvent> = {}): CommunityEvent => ({
  id: 'event-1',
  name: 'Sample Meetup',
  date: '2026-09-24',
  host: 'Sample Host',
  location: 'Sample Venue, Tel Aviv',
  isMembersOnly: false,
  isClosedOut: false,
  isArchived: false,
  ...overrides,
})

export const buildRegistrant = (overrides: Partial<Registrant> = {}): Registrant => ({
  id: 'registrant-1',
  eventId: 'event-1',
  name: 'Sample Person',
  email: 'sample.person@example.com',
  company: undefined,
  jobTitle: undefined,
  registration: 'registered',
  checkedInAt: undefined,
  guestOfEmail: undefined,
  isWalkIn: false,
  ...overrides,
})
