import type { DeclineDecision } from './decision'
import { locateLeadStatusCell } from './locateLeadStatusCell'
import type { SheetsClient } from '../../sheets/sheetsClient'

const DECLINED_STATUS = 'Declined'

/* Declining touches the Leads tab and nothing else. The Members tab is not read,
   not appended to and not reactivated: somebody who was turned away has no
   member record, and somebody who used to have one keeps it exactly as it was. */
export const declineLead = async ({
  sheetsClient,
  decision,
}: {
  sheetsClient: SheetsClient
  decision: DeclineDecision
}): Promise<void> => {
  const statusCell = await locateLeadStatusCell({ sheetsClient, lead: decision.lead })
  await sheetsClient.updateCell({
    range: statusCell.range,
    value: DECLINED_STATUS,
    valueInputOption: 'USER_ENTERED',
  })
}
