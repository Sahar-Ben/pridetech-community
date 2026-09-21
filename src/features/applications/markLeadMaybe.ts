import type { MaybeDecision } from './decision'
import { RECORDED_LEAD_STATUS } from './lead'
import { writeLeadStatus } from './writeLeadStatus'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* Neither a yes nor a no: the application stays readable, leaves the queue, and
   can be approved or declined later from its own view. */
export const markLeadMaybe = async ({
  sheetsClient,
  decision,
}: {
  sheetsClient: SheetsClient
  decision: MaybeDecision
}): Promise<void> =>
  await writeLeadStatus({
    sheetsClient,
    lead: decision.lead,
    status: RECORDED_LEAD_STATUS.maybe,
  })
