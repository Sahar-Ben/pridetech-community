import { toRangeTabName } from '../../sheets/rangeTabName'

/* The three tabs the event registry lives in. They are named and spelled once
   here: every range below is built from these names, and a name that drifted
   from the one a tab was created under would read an empty tab and write into
   a new one. */
export const EVENTS_TAB_NAME = 'Events'

export const EVENT_SHEETS_TAB_NAME = 'Event sheets'

export const ATTENDANCE_TAB_NAME = 'Attendance'

/* An event keeps its identity in a cell rather than in its position: rows move
   when somebody sorts the tab by date, and every attendance row points at an
   event by this id. `Capacity` and `Notes` are created and never written by
   this app — they settle the shape of the tab now so the organiser is not asked
   to add columns to it later, and the write path only ever touches the cells it
   changed, so whatever is typed into them by hand stays there. */
export const EVENTS_HEADINGS = [
  'Event ID',
  'Name',
  'Date',
  'Host',
  'Location',
  'Capacity',
  'Members only',
  'Closed out',
  'Archived',
  'Notes',
] as const

/* One row per attached response sheet rather than a column on the event: an
   event can have a main sheet and a waiting list kept somewhere else entirely,
   and a cell cannot hold a list of them. */
export const EVENT_SHEETS_HEADINGS = [
  'Event ID',
  'Spreadsheet ID',
  'Sheet name',
  'Role',
  'Column mapping',
] as const

export const ATTENDANCE_HEADINGS = [
  'Event ID',
  'Email',
  'Name',
  'Status',
  'Checked in at',
  'Guest of',
] as const

export const RESPONSE_SHEET_ROLES = ['main', 'waiting list'] as const

export type ResponseSheetRole = (typeof RESPONSE_SHEET_ROLES)[number]

/* `headings` is the whole row this app writes when it sets a tab up.
   `requiredHeadings` is the smaller set it refuses to work without, and the two
   differ on purpose: a tab somebody already built is judged on the columns this
   app actually reads and writes, so a registry missing only a column nothing
   uses is not turned into a blocked screen. */
export type RegistryTabDefinition = {
  tabName: string
  headings: readonly string[]
  requiredHeadings: readonly string[]
  holds: string
}

export const REGISTRY_TAB_DEFINITIONS: readonly RegistryTabDefinition[] = [
  {
    tabName: EVENTS_TAB_NAME,
    headings: EVENTS_HEADINGS,
    requiredHeadings: EVENTS_HEADINGS.filter(
      (heading) => heading !== 'Capacity' && heading !== 'Notes',
    ),
    holds: 'one row per event',
  },
  {
    tabName: EVENT_SHEETS_TAB_NAME,
    headings: EVENT_SHEETS_HEADINGS,
    requiredHeadings: EVENT_SHEETS_HEADINGS,
    holds: 'one row per response sheet attached to an event',
  },
  {
    tabName: ATTENDANCE_TAB_NAME,
    headings: ATTENDANCE_HEADINGS,
    requiredHeadings: ATTENDANCE_HEADINGS,
    holds: 'one row per person per event, once check-in is built',
  },
]

const LAST_READ_COLUMN = 'Z'

const buildTabRange = (tabName: string): string =>
  `${toRangeTabName(tabName)}!A1:${LAST_READ_COLUMN}`

const buildHeaderRange = (tabName: string): string =>
  `${toRangeTabName(tabName)}!A1:${LAST_READ_COLUMN}1`

export const buildRegistryHeaderRange = buildHeaderRange

export const EVENTS_RANGE = buildTabRange(EVENTS_TAB_NAME)

export const EVENTS_HEADER_RANGE = buildHeaderRange(EVENTS_TAB_NAME)

export const EVENTS_APPEND_RANGE = `${toRangeTabName(EVENTS_TAB_NAME)}!A:${LAST_READ_COLUMN}`

export const EVENT_SHEETS_RANGE = buildTabRange(EVENT_SHEETS_TAB_NAME)

export const EVENT_SHEETS_APPEND_RANGE = `${toRangeTabName(EVENT_SHEETS_TAB_NAME)}!A:${LAST_READ_COLUMN}`

export const buildRegistryTabRange = buildTabRange

export const buildEventRowRange = (rowNumber: number): string =>
  `${toRangeTabName(EVENTS_TAB_NAME)}!A${rowNumber}:${LAST_READ_COLUMN}${rowNumber}`
