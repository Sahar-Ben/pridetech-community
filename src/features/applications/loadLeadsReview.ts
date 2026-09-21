import { buildLeadsReview, type LeadsReview } from './leadsReview'
import { buildMemberEmailIndex } from './memberEmailIndex'
import { parseLeads } from './parseLeads'
import { LEADS_RANGE, LEADS_TAB_NAME, MEMBERS_RANGE, MEMBERS_TAB_NAME } from './sheetTabs'
import { readTabRows } from '../../sheets/readTabRows'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* Both tabs are read together, and either failing fails the load. Showing the
   queue from a successful Leads read while the Members read failed would put
   every already-approved applicant back in front of the reviewer, looking for
   all the world like a correct queue. */
export const loadLeadsReview = async ({
  sheetsClient,
}: {
  sheetsClient: SheetsClient
}): Promise<LeadsReview> => {
  const [leadRows, memberRows] = await Promise.all([
    readTabRows({ sheetsClient, range: LEADS_RANGE, tabName: LEADS_TAB_NAME }),
    readTabRows({ sheetsClient, range: MEMBERS_RANGE, tabName: MEMBERS_TAB_NAME }),
  ])

  return buildLeadsReview({
    parsedLeads: parseLeads({ rows: leadRows }),
    memberEmailIndex: buildMemberEmailIndex({ rows: memberRows }),
  })
}
