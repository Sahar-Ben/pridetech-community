import type { CommunityEvent } from './communityEvent'

/* Invented events so the section can be reviewed before the sheet reads land.
   No event, venue or host company here is real. The shape is what matters:
   two early events whose forms never asked for an email, one past event that
   was closed out and one that never was, a waitlist kept on its own sheet, a
   singles night that collects plus-ones and accepts non-members, one list big enough to feel at a
   door, and an archived duplicate. Delete this file, and sampleEventRegistrants,
   once the Events tab is read from the Dashboard spreadsheet. */
export const SAMPLE_EVENTS: readonly CommunityEvent[] = [
  {
    id: 'event-opening',
    name: 'Opening Meetup',
    date: '2025-05-14',
    host: undefined,
    location: 'Marrow and Vine loft, Tel Aviv',
    isMembersOnly: true,
    isClosedOut: true,
    isArchived: false,
  },
  {
    id: 'event-second',
    name: 'Second Meetup',
    date: '2025-07-09',
    host: 'Kiln Street Collective',
    location: 'Kiln Street 4, Jaffa',
    isMembersOnly: true,
    isClosedOut: true,
    isArchived: false,
  },
  {
    id: 'event-rooftop',
    name: 'Summer Rooftop Social',
    date: '2025-09-03',
    host: 'Halberd Analytics',
    location: 'Halberd Analytics rooftop, Ramat Gan',
    isMembersOnly: true,
    isClosedOut: true,
    isArchived: false,
  },
  {
    id: 'event-winter',
    name: 'Winter Mixer',
    date: '2025-12-10',
    host: 'Tessellate Robotics',
    location: 'Tessellate Robotics, Petah Tikva',
    isMembersOnly: true,
    isClosedOut: true,
    isArchived: true,
  },
  {
    id: 'event-singles',
    name: 'Singles Night',
    date: '2026-02-11',
    host: undefined,
    location: 'The Copper Room, Tel Aviv',
    isMembersOnly: false,
    isClosedOut: true,
    isArchived: false,
  },
  {
    id: 'event-panel',
    name: 'Pride Month Panel',
    date: '2026-06-24',
    host: 'Quillon Cloud',
    location: 'Quillon Cloud auditorium, Herzliya',
    isMembersOnly: true,
    isClosedOut: false,
    isArchived: false,
  },
  {
    id: 'event-hiring',
    name: 'Autumn Hiring Mixer',
    date: '2026-09-24',
    host: 'Fennimore Labs',
    location: 'Fennimore Labs, Tel Aviv',
    isMembersOnly: true,
    isClosedOut: false,
    isArchived: false,
  },
  {
    id: 'event-boardgames',
    name: 'Board Games and Bring a Friend',
    date: '2026-10-15',
    host: undefined,
    location: 'Pell and Quarry cafe, Haifa',
    isMembersOnly: false,
    isClosedOut: false,
    isArchived: false,
  },
]
