import { buildAttendanceRow, parseAttendance, type AttendanceEntry } from './attendanceLog'
import {
  ATTENDANCE_APPEND_RANGE,
  ATTENDANCE_RANGE,
  ATTENDANCE_TAB_NAME,
  buildRegistryHeaderRange,
} from './eventRegistryTabs'
import { readTabRows } from '../../sheets/readTabRows'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* The door's only way to the Attendance tab. `appendEntry` settles once the
   sheet has the row, and rejects when it does not. */
export type AttendanceStore = {
  readEntries: () => Promise<readonly AttendanceEntry[]>
  appendEntry: (entry: AttendanceEntry) => Promise<void>
}

/* The header row is kept from the last read, so a tap at the door costs one
   request rather than two: Google allows a signed-in person only so many a
   minute, and a queue at the door spends them fast. */
export const createAttendanceStore = (sheetsClient: SheetsClient): AttendanceStore => {
  let headerRow: readonly string[] | undefined

  const readHeaderRow = async (): Promise<readonly string[]> => {
    if (headerRow !== undefined) {
      return headerRow
    }
    const rows = await sheetsClient.readRange({ range: buildRegistryHeaderRange(ATTENDANCE_TAB_NAME) })
    const readHeader = rows[0]
    if (readHeader === undefined) {
      throw new Error(`The ${ATTENDANCE_TAB_NAME} tab has no header row to write under.`)
    }
    headerRow = readHeader
    return readHeader
  }

  return {
    readEntries: async () => {
      const rows = await readTabRows({
        sheetsClient,
        range: ATTENDANCE_RANGE,
        tabName: ATTENDANCE_TAB_NAME,
      })
      const entries = parseAttendance({ rows })
      headerRow = rows[0]
      return entries
    },

    /* RAW: the timestamp is an ISO string, and a spreadsheet invited to
       interpret it would turn it into a date in its own locale. */
    appendEntry: async (entry) => {
      await sheetsClient.appendRow({
        range: ATTENDANCE_APPEND_RANGE,
        values: buildAttendanceRow({ headerRow: await readHeaderRow(), entry }),
        valueInputOption: 'RAW',
      })
    },
  }
}
