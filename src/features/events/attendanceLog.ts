import { ATTENDANCE_TAB_NAME } from './eventRegistryTabs'
import type { Registrant } from './registrant'
import { toEmailKey } from '../../sheets/emailKey'
import { hasAnyRecordedCell } from '../../sheets/readCell'
import { createSheetColumns, type SheetColumnDefinition } from '../../sheets/sheetColumns'

/* The Attendance tab is a log: every tap at the door appends a row, and nothing
   here ever edits one. Two organisers at one door on two phones is the normal
   case, and a log is the only shape that survives it: an edit addresses a row
   by number, and the other phone's append moves nothing but can be racing the
   same person. Where somebody stands now is the last row written about them.

   `Checked in at` holds the moment of the tap for both kinds of row, so an undo
   carries the moment it was undone. */
const ATTENDANCE_COLUMN_DEFINITIONS = {
  eventId: { label: 'Event ID', aliases: ['event id'] },
  email: { label: 'Email', aliases: ['email'] },
  name: { label: 'Name', aliases: ['name'] },
  status: { label: 'Status', aliases: ['status'] },
  at: { label: 'Checked in at', aliases: ['checked in at'] },
  guestOf: { label: 'Guest of', aliases: ['guest of'] },
} as const satisfies Record<string, SheetColumnDefinition>

type AttendanceColumnTarget = keyof typeof ATTENDANCE_COLUMN_DEFINITIONS

export const ATTENDANCE_COLUMNS = createSheetColumns<AttendanceColumnTarget>({
  tabName: ATTENDANCE_TAB_NAME,
  columns: ATTENDANCE_COLUMN_DEFINITIONS,
})

const REQUIRED_TARGETS: readonly AttendanceColumnTarget[] = [
  'eventId',
  'email',
  'name',
  'status',
  'at',
]

export const RECORDED_ATTENDANCE_STATUS = {
  attended: 'Attended',
  undone: 'Check-in undone',
} as const

export type AttendanceStatus = keyof typeof RECORDED_ATTENDANCE_STATUS

export type AttendanceEntry = {
  eventId: string
  email: string | undefined
  name: string
  status: AttendanceStatus
  at: string
}

const toComparable = (value: string): string => value.trim().replace(/\s+/g, ' ').toLowerCase()

const STATUS_BY_RECORDED_VALUE: ReadonlyMap<string, AttendanceStatus> = new Map([
  [toComparable(RECORDED_ATTENDANCE_STATUS.attended), 'attended'],
  [toComparable(RECORDED_ATTENDANCE_STATUS.undone), 'undone'],
])

/* A registrant is known by their email, and by their name only on the early
   sheets that never asked for one. The prefix keeps a name that happens to look
   like an address from colliding with somebody's email. */
export const toAttendanceKey = ({
  email,
  name,
}: {
  email: string | undefined
  name: string
}): string => {
  const emailKey = email === undefined ? '' : toEmailKey(email)
  return emailKey === '' ? `name:${toComparable(name)}` : `email:${emailKey}`
}

/* A row with an unrecognised status is skipped rather than guessed at: reading
   "maybe" as attended would put somebody in the room who never came, and the
   log only ever gets the two statuses this app writes. */
export const parseAttendance = ({
  rows,
}: {
  rows: readonly (readonly string[])[]
}): readonly AttendanceEntry[] => {
  const [headerRow, ...dataRows] = rows
  if (headerRow === undefined) {
    throw new Error(`The ${ATTENDANCE_TAB_NAME} tab came back empty \u{2014} it has no header row.`)
  }
  const missing = ATTENDANCE_COLUMNS.findMissing({ headerRow, targets: REQUIRED_TARGETS })
  if (missing.length > 0) {
    throw new Error(
      `The ${ATTENDANCE_TAB_NAME} tab has no column headed ${missing.join(' or ')} \u{2014} restore the heading in the sheet, then reload.`,
    )
  }
  const cell = (row: readonly string[], target: AttendanceColumnTarget) =>
    ATTENDANCE_COLUMNS.readCell({ headerRow, row, target })

  return dataRows.filter(hasAnyRecordedCell).flatMap((row) => {
    const eventId = cell(row, 'eventId')
    const status = STATUS_BY_RECORDED_VALUE.get(toComparable(cell(row, 'status') ?? ''))
    const email = cell(row, 'email')
    const name = cell(row, 'name') ?? email
    const at = cell(row, 'at')
    if (eventId === undefined || status === undefined || name === undefined || at === undefined) {
      return []
    }
    return [{ eventId, email, name, status, at }]
  })
}

export const buildAttendanceRow = ({
  headerRow,
  entry,
}: {
  headerRow: readonly string[]
  entry: AttendanceEntry
}): string[] =>
  ATTENDANCE_COLUMNS.buildRow({
    headerRow,
    writes: [
      { target: 'eventId', value: entry.eventId },
      { target: 'email', value: entry.email ?? '' },
      { target: 'name', value: entry.name },
      { target: 'status', value: RECORDED_ATTENDANCE_STATUS[entry.status] },
      { target: 'at', value: entry.at },
    ],
  })

/* The last word on each person at one event, in log order. */
const latestByPerson = ({
  entries,
  eventId,
}: {
  entries: readonly AttendanceEntry[]
  eventId: string
}): ReadonlyMap<string, AttendanceEntry> =>
  new Map(
    entries
      .filter((entry) => entry.eventId === eventId)
      .map((entry) => [toAttendanceKey(entry), entry] as const),
  )

export const WALK_IN_ID_PREFIX = 'attendance:'

/* The registrants of one event as the door sees them: each checked in if the
   log's last word on them is a check-in, and as they came when the log has
   nothing on them, plus everybody the log has checked in
   who is on no response sheet — the walk-ins. A walk-in whose check-in was
   undone is dropped, since the only thing that put them on the list was the
   check-in. */
export const applyAttendance = ({
  registrants,
  entries,
  eventId,
}: {
  registrants: readonly Registrant[]
  entries: readonly AttendanceEntry[]
  eventId: string
}): readonly Registrant[] => {
  const latest = latestByPerson({ entries, eventId })
  const registeredKeys = new Set(registrants.map(toAttendanceKey))

  const withArrivals = registrants.map((registrant) => {
    const entry = latest.get(toAttendanceKey(registrant))
    if (entry === undefined) {
      return registrant
    }
    return { ...registrant, checkedInAt: entry.status === 'attended' ? entry.at : undefined }
  })

  const walkIns = [...latest]
    .filter(([key, entry]) => !registeredKeys.has(key) && entry.status === 'attended')
    .map(
      ([key, entry]): Registrant => ({
        id: `${WALK_IN_ID_PREFIX}${key}`,
        eventId,
        name: entry.name,
        email: entry.email,
        company: undefined,
        jobTitle: undefined,
        registration: 'registered',
        checkedInAt: entry.at,
        guestOfEmail: undefined,
        isWalkIn: true,
      }),
    )

  return [...withArrivals, ...walkIns]
}
