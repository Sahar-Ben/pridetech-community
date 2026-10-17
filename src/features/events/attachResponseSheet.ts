import { ATTACHED_SHEET_COLUMNS } from './attachedSheetColumns'
import {
  EVENT_SHEETS_APPEND_RANGE,
  EVENT_SHEETS_RANGE,
  EVENT_SHEETS_TAB_NAME,
  type ResponseSheetRole,
} from './eventRegistryTabs'
import { recordColumnMapping, type ResponseSheetMapping } from './responseSheetMapping'
import { readCell } from '../../sheets/readCell'
import type { SheetsClient } from '../../sheets/sheetsClient'

const HEADER_ROW_COUNT = 1

/* What the organiser confirmed on the attach screen: which file, which tab
   inside it, what the sheet is for, and which column holds what. The mapping
   is theirs rather than the guess, which is the whole point of showing it. */
export type ResponseSheetAttachment = {
  eventId: string
  spreadsheetId: string
  sheetName: string
  role: ResponseSheetRole
  mapping: ResponseSheetMapping
}

/* The row already recording this tab against this event, if there is one. It
   is found in the same read the write is placed by, so a row number taken from
   it cannot have gone stale in between. */
const findRecordedRowNumber = ({
  rows,
  headerRow,
  attachment,
}: {
  rows: readonly (readonly string[])[]
  headerRow: readonly string[]
  attachment: ResponseSheetAttachment
}): number | undefined => {
  const columns = ATTACHED_SHEET_COLUMNS.locate(headerRow)
  const index = rows
    .slice(HEADER_ROW_COUNT)
    .findIndex(
      (row) =>
        readCell({ row, column: columns.eventId }) === attachment.eventId &&
        readCell({ row, column: columns.spreadsheetId }) === attachment.spreadsheetId &&
        readCell({ row, column: columns.sheetName }) === attachment.sheetName,
    )
  return index === -1 ? undefined : index + HEADER_ROW_COUNT + 1
}

/* Attaching a tab that is already attached to the event changes its columns
   rather than recording it twice. A second row for the same tab would read
   every person on it twice, and the people with no email on them would then
   be counted twice at the door, because nothing tells them apart.

   RAW either way: the mapping is JSON, and a cell beginning with a brace is not
   something the spreadsheet should be invited to interpret. */
export const attachResponseSheet = async ({
  sheetsClient,
  attachment,
}: {
  sheetsClient: SheetsClient
  attachment: ResponseSheetAttachment
}): Promise<void> => {
  const rows = await sheetsClient.readRange({ range: EVENT_SHEETS_RANGE })
  const headerRow = rows[0]
  if (headerRow === undefined) {
    throw new Error(
      `The ${EVENT_SHEETS_TAB_NAME} tab has no header row to write under \u{2014} nothing was written.`,
    )
  }

  const describedWrites = [
    { target: 'role', value: attachment.role },
    { target: 'mapping', value: recordColumnMapping(attachment.mapping) },
  ] as const

  const recordedRowNumber = findRecordedRowNumber({ rows, headerRow, attachment })
  if (recordedRowNumber !== undefined) {
    await sheetsClient.updateCells({
      writes: ATTACHED_SHEET_COLUMNS.buildCellWrites({
        headerRow,
        rowNumber: recordedRowNumber,
        writes: describedWrites,
      }),
      valueInputOption: 'RAW',
    })
    return
  }

  await sheetsClient.appendRow({
    range: EVENT_SHEETS_APPEND_RANGE,
    values: ATTACHED_SHEET_COLUMNS.buildRow({
      headerRow,
      writes: [
        { target: 'eventId', value: attachment.eventId },
        { target: 'spreadsheetId', value: attachment.spreadsheetId },
        { target: 'sheetName', value: attachment.sheetName },
        ...describedWrites,
      ],
    }),
    valueInputOption: 'RAW',
  })
}
