import { applyAttendance } from '../events/attendanceLog'
import { createAttendanceStore } from '../events/attendanceStore'
import type { CommunityEvent } from '../events/communityEvent'
import { loadEventRegistrants, type SheetReadProblem } from '../events/loadEventRegistrants'
import { loadEventRegistry } from '../events/loadEventRegistry'
import { selectSheetsForEvent } from '../events/parseAttachedSheets'
import type { Registrant } from '../events/registrant'
import type { ResponseSheetAccess } from '../events/responseSheetAccess'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* Every event and everybody at it, with who arrived laid over who registered.
   `unreadSheets` are the sheets that could not be opened, so a history built
   from this can say it may be missing events rather than look complete. */
export type CommunityEventHistory = {
  events: readonly CommunityEvent[]
  registrants: readonly Registrant[]
  unreadSheets: readonly SheetReadProblem[]
}

/* One read of the registry and the Attendance tab, then every event's sheets
   in parallel: a read per sheet, which is why the caller makes it once and
   keeps it rather than once per member opened. Archived events are left out,
   the way they are left out of the events list. */
export const loadCommunityEventHistory = async ({
  sheetsClient,
  access,
}: {
  sheetsClient: SheetsClient
  access: ResponseSheetAccess
}): Promise<CommunityEventHistory> => {
  const [registry, attendance] = await Promise.all([
    loadEventRegistry({ sheetsClient }),
    createAttendanceStore(sheetsClient).readEntries(),
  ])
  const events = registry.events.filter((event) => !event.isArchived)
  const reads = await Promise.all(
    events.map(async (event) => ({
      event,
      read: await loadEventRegistrants({
        access,
        sheets: selectSheetsForEvent({ sheets: registry.attachedSheets, eventId: event.id }),
      }),
    })),
  )
  return {
    events,
    registrants: reads.flatMap(({ event, read }) =>
      applyAttendance({ registrants: read.registrants, entries: attendance, eventId: event.id }),
    ),
    unreadSheets: reads.flatMap(({ read }) => read.problems),
  }
}
