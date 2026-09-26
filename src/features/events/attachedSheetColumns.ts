import { EVENT_SHEETS_TAB_NAME } from './eventRegistryTabs'
import { createSheetColumns, type SheetColumnDefinition } from '../../sheets/sheetColumns'

const ATTACHED_SHEET_COLUMN_DEFINITIONS = {
  eventId: { label: 'Event ID', aliases: ['event id'] },
  spreadsheetId: { label: 'Spreadsheet ID', aliases: ['spreadsheet id'] },
  sheetName: { label: 'Sheet name', aliases: ['sheet name'] },
  role: { label: 'Role', aliases: ['role'] },
  mapping: { label: 'Column mapping', aliases: ['column mapping'] },
} as const satisfies Record<string, SheetColumnDefinition>

export type AttachedSheetColumnTarget = keyof typeof ATTACHED_SHEET_COLUMN_DEFINITIONS

export const ATTACHED_SHEET_COLUMNS = createSheetColumns<AttachedSheetColumnTarget>({
  tabName: EVENT_SHEETS_TAB_NAME,
  columns: ATTACHED_SHEET_COLUMN_DEFINITIONS,
})

export const ATTACHED_SHEET_COLUMN_TARGETS: readonly AttachedSheetColumnTarget[] = [
  'eventId',
  'spreadsheetId',
  'sheetName',
  'role',
  'mapping',
]
