import type { Lead, RecordedLeadStatusValue } from './lead'
import { locateLeadStatusCell } from './locateLeadStatusCell'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* The whole of a decline, and the whole of a maybe: one cell on the Leads tab,
   written through the row-staleness check in `locateLeadStatusCell`. The
   Members tab is not read, not appended to and not reactivated, because neither
   decision gives anybody a member record or takes one away. Approving is the
   one decision that cannot go through here \u{2014} it has a member row to write
   first, and the order of those two writes is what stops an applicant being
   marked approved and existing nowhere. */
export const writeLeadStatus = async ({
  sheetsClient,
  lead,
  status,
}: {
  sheetsClient: SheetsClient
  lead: Lead
  status: RecordedLeadStatusValue
}): Promise<void> => {
  const statusCell = await locateLeadStatusCell({ sheetsClient, lead })
  await sheetsClient.updateCell({
    range: statusCell.range,
    value: status,
    valueInputOption: 'USER_ENTERED',
  })
}
