import type { Lead, RecordedLeadStatusValue } from './lead'
import { locateLeadStatusCell, type LeadStatusCell } from './locateLeadStatusCell'
import { LEADS_TAB_NAME } from './sheetTabs'
import type { CellWrite, SheetsClient } from '../../sheets/sheetsClient'

/* A status with no reason beside it is a decision somebody can still read; a
   reason with no status beside it is a sentence about an application that still
   looks undecided, and a reviewer reading the tab would have no way to tell
   which of the two it was about. So the pair is built before anything is sent,
   and a missing Reason column stops the decision here rather than writing half
   of it: nothing is written, and the reviewer is told which heading the tab
   needs. Skipping the reason is not that case — there is nothing to lose, so the
   decision goes through on the status alone. */
const buildDecisionWrites = ({
  statusCell,
  status,
  reason,
}: {
  statusCell: LeadStatusCell
  status: RecordedLeadStatusValue
  reason: string | undefined
}): readonly CellWrite[] => {
  const statusWrite = { range: statusCell.range, value: status }
  if (reason === undefined) {
    return [statusWrite]
  }
  if (statusCell.reasonRange === undefined) {
    throw new Error(
      `The ${LEADS_TAB_NAME} tab has no Reason column to write the reason into, so the decision and the reason could not be recorded together — nothing was written. Add a column headed Reason, or take the decision without a reason.`,
    )
  }
  return [statusWrite, { range: statusCell.reasonRange, value: reason }]
}

/* The whole of a decline, and the whole of a maybe: two cells on the Leads tab,
   written through the row-staleness check in `locateLeadStatusCell` and sent as
   one request so the decision and its reason cannot land apart. The Members tab
   is not read, not appended to and not reactivated, because neither decision
   gives anybody a member record or takes one away. Approving is the one decision
   that cannot go through here — it has a member row to write first, and the
   order of those two writes is what stops an applicant being marked approved and
   existing nowhere.

   RAW, where the status write alone used to be USER_ENTERED: the reason is free
   text a reviewer typed, and `=SUM(A:A)`, `+1 year` or `-not in tech` sent as
   USER_ENTERED is re-parsed by Google as a formula or a sum. What comes back is
   then whatever that evaluated to rather than what the reviewer wrote, and the
   sentence explaining why somebody was turned away is gone. */
export const writeLeadStatus = async ({
  sheetsClient,
  lead,
  status,
  reason,
}: {
  sheetsClient: SheetsClient
  lead: Lead
  status: RecordedLeadStatusValue
  reason: string | undefined
}): Promise<void> => {
  const statusCell = await locateLeadStatusCell({ sheetsClient, lead })
  await sheetsClient.updateCells({
    writes: buildDecisionWrites({ statusCell, status, reason }),
    valueInputOption: 'RAW',
  })
}
