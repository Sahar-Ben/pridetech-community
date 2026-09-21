import { LEADS_TAB_NAME } from './sheetTabs'
import { buildSheetRowUrl } from '../../sheets/sheetRowUrl'

/* The row number is in the link text, not only in the href: a column of bare
   numbers gives a screen reader nothing to tell one link from the next. */
type SheetRowLinkProps = {
  spreadsheetId: string
  rowNumber: number
}

export const SheetRowLink = ({ spreadsheetId, rowNumber }: SheetRowLinkProps) => (
  <a
    className="font-semibold text-accent underline underline-offset-2"
    href={buildSheetRowUrl({ spreadsheetId, tabName: LEADS_TAB_NAME, rowNumber })}
    rel="noopener noreferrer"
    target="_blank"
  >
    Open row {rowNumber} in the sheet
  </a>
)
