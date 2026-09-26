import {
  ATTACHED_SHEET_COLUMNS,
  ATTACHED_SHEET_COLUMN_TARGETS,
  type AttachedSheetColumnTarget,
} from './attachedSheetColumns'
import {
  EVENT_SHEETS_TAB_NAME,
  RESPONSE_SHEET_ROLES,
  type ResponseSheetRole,
} from './eventRegistryTabs'
import { parseColumnMapping, type ResponseSheetMapping } from './responseSheetMapping'
import { hasAnyRecordedCell, readCell } from '../../sheets/readCell'

const HEADER_ROW_COUNT = 1

const DEFAULT_ROLE: ResponseSheetRole = 'main'

/* One response sheet attached to one event. `mapping` is `undefined` when the
   cell holding it could not be read, which is not the same as a sheet that has
   no such columns: that sheet has a mapping naming nothing. */
export type AttachedResponseSheet = {
  rowNumber: number
  eventId: string
  spreadsheetId: string
  sheetName: string
  role: ResponseSheetRole
  mapping: ResponseSheetMapping | undefined
}

export type AttachedSheetIssue =
  | { kind: 'no-event-id'; rowNumber: number }
  | { kind: 'no-sheet'; rowNumber: number }
  | { kind: 'unknown-role'; rowNumber: number; recordedRole: string }
  | { kind: 'unreadable-mapping'; rowNumber: number }

export type ParsedAttachedSheets = {
  sheets: readonly AttachedResponseSheet[]
  issues: readonly AttachedSheetIssue[]
}

type ReadRow = { rowNumber: number; row: readonly string[] }

const requireHeaderRow = (rows: readonly (readonly string[])[]): readonly string[] => {
  const [headerRow] = rows
  if (headerRow === undefined) {
    throw new Error(
      `The ${EVENT_SHEETS_TAB_NAME} tab came back empty \u{2014} it has no header row to read.`,
    )
  }
  const missingLabels = ATTACHED_SHEET_COLUMNS.findMissing({
    headerRow,
    targets: ATTACHED_SHEET_COLUMN_TARGETS,
  })
  if (missingLabels.length > 0) {
    throw new Error(
      `The ${EVENT_SHEETS_TAB_NAME} tab has no column headed ${missingLabels.join(' or ')} \u{2014} restore the heading in the sheet, then reload.`,
    )
  }
  return headerRow
}

/* An unrecognised role is read as `main` and reported. Dropping the row would
   hide a response sheet somebody attached, and reading it as a waiting list
   would be the same guess in the more damaging direction: a waiting list is
   not counted as a registration. */
const readRole = (recordedRole: string | undefined): ResponseSheetRole | undefined =>
  RESPONSE_SHEET_ROLES.find(
    (role) => role === recordedRole?.trim().replace(/\s+/g, ' ').toLowerCase(),
  )

const parseRow = ({
  rowNumber,
  row,
  columns,
}: {
  rowNumber: number
  row: readonly string[]
  columns: Partial<Record<AttachedSheetColumnTarget, number>>
}): ParsedAttachedSheets => {
  const cell = (target: AttachedSheetColumnTarget): string | undefined =>
    readCell({ row, column: columns[target] })

  const eventId = cell('eventId')
  if (eventId === undefined) {
    return { sheets: [], issues: [{ kind: 'no-event-id', rowNumber }] }
  }

  const spreadsheetId = cell('spreadsheetId')
  const sheetName = cell('sheetName')
  if (spreadsheetId === undefined || sheetName === undefined) {
    return { sheets: [], issues: [{ kind: 'no-sheet', rowNumber }] }
  }

  const recordedRole = cell('role')
  const role = readRole(recordedRole)
  const mapping = parseColumnMapping(cell('mapping'))

  return {
    sheets: [
      { rowNumber, eventId, spreadsheetId, sheetName, role: role ?? DEFAULT_ROLE, mapping },
    ],
    issues: [
      ...(role === undefined
        ? [{ kind: 'unknown-role' as const, rowNumber, recordedRole: recordedRole ?? '' }]
        : []),
      ...(mapping === undefined ? [{ kind: 'unreadable-mapping' as const, rowNumber }] : []),
    ],
  }
}

export const parseAttachedSheets = ({
  rows,
}: {
  rows: readonly (readonly string[])[]
}): ParsedAttachedSheets => {
  const headerRow = requireHeaderRow(rows)
  const columns = ATTACHED_SHEET_COLUMNS.locate(headerRow)

  const recordedRows: readonly ReadRow[] = rows
    .slice(HEADER_ROW_COUNT)
    .map((row, index) => ({ rowNumber: index + HEADER_ROW_COUNT + 1, row }))
    .filter(({ row }) => hasAnyRecordedCell(row))

  const parsedRows = recordedRows.map(({ rowNumber, row }) => parseRow({ rowNumber, row, columns }))

  return {
    sheets: parsedRows.flatMap((parsed) => parsed.sheets),
    issues: parsedRows.flatMap((parsed) => parsed.issues),
  }
}

export const selectSheetsForEvent = ({
  sheets,
  eventId,
}: {
  sheets: readonly AttachedResponseSheet[]
  eventId: string
}): readonly AttachedResponseSheet[] => sheets.filter((sheet) => sheet.eventId === eventId)
