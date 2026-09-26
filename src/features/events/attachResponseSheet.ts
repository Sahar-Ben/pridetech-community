import { ATTACHED_SHEET_COLUMNS } from './attachedSheetColumns'
import {
  buildRegistryHeaderRange,
  EVENT_SHEETS_APPEND_RANGE,
  EVENT_SHEETS_TAB_NAME,
  type ResponseSheetRole,
} from './eventRegistryTabs'
import { recordColumnMapping, type ResponseSheetMapping } from './responseSheetMapping'
import type { SheetsClient } from '../../sheets/sheetsClient'

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

export const attachResponseSheet = async ({
  sheetsClient,
  attachment,
}: {
  sheetsClient: SheetsClient
  attachment: ResponseSheetAttachment
}): Promise<void> => {
  const headerRows = await sheetsClient.readRange({
    range: buildRegistryHeaderRange(EVENT_SHEETS_TAB_NAME),
  })
  const headerRow = headerRows[0]
  if (headerRow === undefined) {
    throw new Error(
      `The ${EVENT_SHEETS_TAB_NAME} tab has no header row to write under \u{2014} nothing was written.`,
    )
  }

  /* RAW: the mapping is JSON, and a cell beginning with a brace is not
     something the spreadsheet should be invited to interpret. */
  await sheetsClient.appendRow({
    range: EVENT_SHEETS_APPEND_RANGE,
    values: ATTACHED_SHEET_COLUMNS.buildRow({
      headerRow,
      writes: [
        { target: 'eventId', value: attachment.eventId },
        { target: 'spreadsheetId', value: attachment.spreadsheetId },
        { target: 'sheetName', value: attachment.sheetName },
        { target: 'role', value: attachment.role },
        { target: 'mapping', value: recordColumnMapping(attachment.mapping) },
      ],
    }),
    valueInputOption: 'RAW',
  })
}
