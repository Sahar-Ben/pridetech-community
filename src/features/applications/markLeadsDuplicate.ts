import { selectLeadsToMark, type DuplicateApplicant } from './duplicateApplicants'
import { RECORDED_LEAD_STATUS } from './lead'
import { writeLeadStatus } from './writeLeadStatus'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* One row at a time, each through the same row check a decision makes: these
   rows share an address, so the stamp is what proves each one is still the
   application it was read as before its Status is written. The row the
   reviewer chose to keep is never written. No reason goes with the status, so a tab with no Reason
   column can still be cleaned up.

   A refusal part of the way through stops there and says how many were
   marked, because the rows already written are written; reading the sheet
   again shows the rest still waiting to be marked. */
export const markLeadsDuplicate = async ({
  sheetsClient,
  duplicate,
  keptRowNumber,
}: {
  sheetsClient: SheetsClient
  duplicate: DuplicateApplicant
  keptRowNumber: number
}): Promise<void> => {
  const leadsToMark = selectLeadsToMark({ duplicate, keptRowNumber })
  if (leadsToMark.length === duplicate.leads.length) {
    throw new Error(`Row ${keptRowNumber} is not one of these applications \u{2014} nothing was written.`)
  }
  let markedCount = 0
  for (const lead of leadsToMark) {
    try {
      await writeLeadStatus({
        sheetsClient,
        lead,
        status: RECORDED_LEAD_STATUS.duplicate,
        reason: undefined,
      })
    } catch (error: unknown) {
      if (markedCount === 0) {
        throw error
      }
      const reason = error instanceof Error ? ` ${error.message}` : ''
      throw new Error(
        `${markedCount} of ${leadsToMark.length} rows were marked Duplicate before the next one was refused.${reason}`,
        { cause: error },
      )
    }
    markedCount += 1
  }
}
