import { vi } from 'vitest'
import type { AttendanceEntry } from '../features/events/attendanceLog'
import type { AttendanceStore } from '../features/events/attendanceStore'
import type { EventRegistryWriter } from '../features/events/eventRegistryWriter'
import type { AttachedResponseSheet } from '../features/events/parseAttachedSheets'
import type { Registrant } from '../features/events/registrant'
import type { EventRegistrantsLoad } from '../features/events/useEventRegistrants'
import type { ResponseSheetAccess } from '../features/events/responseSheetAccess'

/* A writer that settles without complaint, so a test about the listing is not
   also a test about the sheet. A test about a refused write replaces the one
   method it is about. */
export const createFakeEventRegistryWriter = (
  overrides: Partial<EventRegistryWriter> = {},
): EventRegistryWriter => ({
  addEvent: vi.fn(async () => await Promise.resolve()),
  saveEvent: vi.fn(async () => await Promise.resolve()),
  attachSheet: vi.fn(async () => await Promise.resolve()),
  ...overrides,
})

export const createFakeResponseSheetAccess = (
  overrides: Partial<ResponseSheetAccess> = {},
): ResponseSheetAccess => ({
  pickSpreadsheet: vi.fn(
    async () => await Promise.resolve({ spreadsheetId: 'responses-1', name: 'Responses' }),
  ),
  readTabNames: vi.fn(async () => await Promise.resolve(['Form Responses 1'])),
  readHeaderRow: vi.fn(
    async () => await Promise.resolve(['Timestamp', 'Name', 'Email', 'Company']),
  ),
  readRows: vi.fn(
    async () => await Promise.resolve([['Timestamp', 'Name', 'Email', 'Company']]),
  ),
  ...overrides,
})

export const buildAttachedSheet = (
  overrides: Partial<AttachedResponseSheet> = {},
): AttachedResponseSheet => ({
  rowNumber: 2,
  eventId: 'event-1',
  spreadsheetId: 'responses-1',
  sheetName: 'Form Responses 1',
  role: 'main',
  mapping: { timestamp: 0, name: 1, email: 2, company: 3 },
  ...overrides,
})

/* Registrants as if every event they belong to had already had its sheets
   read, so a test about the list or the door does not wait on a read. */
export const buildRegistrantLoads = (
  registrants: readonly Registrant[],
): ReadonlyMap<string, EventRegistrantsLoad> => {
  const eventIds = [...new Set(registrants.map((registrant) => registrant.eventId))]
  const byEvent = eventIds.map(
    (eventId) =>
      [eventId, registrants.filter((registrant) => registrant.eventId === eventId)] as const,
  )
  return new Map(
    byEvent.map(([eventId, eventRegistrants]) => [
      eventId,
      {
        read: {
          registrants: eventRegistrants,
          repeatedCount: 0,
          rowsWithoutNameOrEmail: [],
          problems: [],
        },
        isReading: false,
        errorMessage: undefined,
      },
    ]),
  )
}

/* An Attendance tab held in memory: every append lands at once, and `log` is
   what the tab would now hold. */
export const createFakeAttendanceStore = (
  initialEntries: readonly AttendanceEntry[] = [],
): AttendanceStore & { log: AttendanceEntry[] } => {
  const log = [...initialEntries]
  return {
    log,
    readEntries: vi.fn(async () => await Promise.resolve([...log])),
    appendEntry: vi.fn(async (entry: AttendanceEntry) => {
      log.push(entry)
      await Promise.resolve()
    }),
  }
}
