import type { DeclineDecision } from './decision'
import { RECORDED_LEAD_STATUS } from './lead'
import { writeLeadStatus } from './writeLeadStatus'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* Declining touches the Leads tab and nothing else. The Members tab is not read,
   not appended to and not reactivated: somebody who was turned away has no
   member record, and somebody who used to have one keeps it exactly as it was. */
export const declineLead = async ({
  sheetsClient,
  decision,
}: {
  sheetsClient: SheetsClient
  decision: DeclineDecision
}): Promise<void> =>
  await writeLeadStatus({
    sheetsClient,
    lead: decision.lead,
    reason: decision.reason,
    status: RECORDED_LEAD_STATUS.declined,
  })
