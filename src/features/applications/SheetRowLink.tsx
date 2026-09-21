import { LEADS_TAB_NAME } from './sheetTabs'
import { buildSheetRowUrl } from '../../sheets/sheetRowUrl'

type SheetRowLinkProps = {
  spreadsheetId: string
  rowNumber: number
}

/* The row number is in the link text, not only in the href: a column of bare
   numbers gives a screen reader nothing to tell one link from the next. */
export const SheetRowLink = ({ spreadsheetId, rowNumber }: SheetRowLinkProps) => (
  <a
    className="text-indigo-700 underline underline-offset-2 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
    href={buildSheetRowUrl({ spreadsheetId, tabName: LEADS_TAB_NAME, rowNumber })}
    rel="noopener noreferrer"
    target="_blank"
  >
    Open row {rowNumber} in the sheet
  </a>
)
