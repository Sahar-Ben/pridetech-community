import type { Lead } from './lead'
import { buildLeadRowRange, LEADS_HEADER_RANGE, LEADS_TAB_NAME } from './sheetTabs'
import { buildCellRange } from '../../sheets/a1Range'
import { COLUMN_ALIASES } from '../../sheets/columnAliases'
import { toEmailKey } from '../../sheets/emailKey'
import { buildHeaderMap, findColumn } from '../../sheets/headerMap'
import { readCell } from '../../sheets/readCell'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* The cell's current contents come back with its address because the caller has
   to tell an application nobody has decided from one that was decided already,
   and reading it a second time would be reading a different moment. */
export type LeadStatusCell = {
  range: string
  recordedStatus: string | undefined
}

const describeApplicant = (lead: Lead): string =>
  lead.name === undefined ? lead.email : `${lead.name} (${lead.email})`

/* A row number is only true for as long as nobody inserts or deletes a row above
   it, and the one this lead carries came from a read that may be minutes old. A
   status written to a stale row number marks the wrong person approved, in a
   sheet where nothing would ever show that it happened. So the row is read back
   and checked against the application being decided, immediately before the
   write, and the Status column is taken from the header read in the same breath:
   the Leads tab is a live Form response sheet, and Google inserts a column every
   time a question is added to the form.

   The address alone does not identify the row. 69 addresses on this tab are on
   more than one application, which is why `duplicateApplicants` exists: with a
   row deleted above, a re-read of the same number lands on the applicant's own
   second application, the address still matches, and `Approved` is written
   against an application nobody read while the one they did read stays pending.
   So `Timestamp` is checked too. It is the Form's own submission stamp, set once
   when the response arrived and never edited, and it differs between two
   applications from one person because they were sent at different moments,
   which is exactly the case the address cannot tell apart. The alternative,
   proving the address unique across the tab, would mean reading all thousand
   rows before every decision and would then refuse all 69 repeat applicants,
   who are the ones a reviewer most needs to decide. A row with no stamp is
   accepted only by a row that still has no stamp. */
export const locateLeadStatusCell = async ({
  sheetsClient,
  lead,
}: {
  sheetsClient: SheetsClient
  lead: Lead
}): Promise<LeadStatusCell> => {
  const [headerRows, leadRows] = await Promise.all([
    sheetsClient.readRange({ range: LEADS_HEADER_RANGE }),
    sheetsClient.readRange({ range: buildLeadRowRange(lead.rowNumber) }),
  ])

  const headerRow = headerRows[0]
  if (headerRow === undefined) {
    throw new Error(
      `The ${LEADS_TAB_NAME} tab has no header row to read \u{2014} nothing was written.`,
    )
  }

  const headerMap = buildHeaderMap(headerRow)
  const emailColumn = findColumn({ headerMap, aliases: COLUMN_ALIASES.email })
  if (emailColumn === undefined) {
    throw new Error(
      `The ${LEADS_TAB_NAME} tab has no email column, so the row could not be checked \u{2014} nothing was written.`,
    )
  }

  const timestampColumn = findColumn({ headerMap, aliases: COLUMN_ALIASES.timestamp })
  if (timestampColumn === undefined) {
    throw new Error(
      `The ${LEADS_TAB_NAME} tab has no Timestamp column, so one application could not be told from another by the same person \u{2014} nothing was written.`,
    )
  }

  const statusColumn = findColumn({ headerMap, aliases: COLUMN_ALIASES.status })
  if (statusColumn === undefined) {
    throw new Error(
      `The ${LEADS_TAB_NAME} tab has no Status column to write the decision into \u{2014} nothing was written.`,
    )
  }

  const currentRow = leadRows[0] ?? []
  const currentEmail = readCell({ row: currentRow, column: emailColumn })
  const currentTimestamp = readCell({ row: currentRow, column: timestampColumn })
  const doesRowStillHoldThisApplication =
    currentEmail !== undefined &&
    toEmailKey(currentEmail) === lead.email &&
    currentTimestamp === lead.timestamp

  if (!doesRowStillHoldThisApplication) {
    throw new Error(
      `The ${LEADS_TAB_NAME} tab changed while you were reviewing: row ${lead.rowNumber} no longer holds ${describeApplicant(lead)}. Nothing was written \u{2014} reload the applications before deciding anything else.`,
    )
  }

  return {
    range: buildCellRange({
      tabName: LEADS_TAB_NAME,
      columnIndex: statusColumn,
      rowNumber: lead.rowNumber,
    }),
    recordedStatus: readCell({ row: currentRow, column: statusColumn }),
  }
}
