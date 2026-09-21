import { buildLeadsReview, type LeadsReview } from './leadsReview'
import { buildMemberEmailIndex } from './memberEmailIndex'
import { parseLeads } from './parseLeads'
import { LEADS_RANGE, MEMBERS_RANGE } from './sheetTabs'
import { describeError } from '../../errors/describeError'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

const readTabRows = async ({
  sheetsClient,
  range,
  tabName,
}: {
  sheetsClient: SheetsClient
  range: string
  tabName: string
}): Promise<string[][]> => {
  try {
    return await sheetsClient.readRange({ range })
  } catch (error: unknown) {
    if (isExpiredSessionError(error)) {
      throw error
    }
    throw new Error(
      `The ${tabName} tab could not be read. ${describeError({ error, fallback: 'Google gave no detail.' })}`,
    )
  }
}

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
    readTabRows({ sheetsClient, range: LEADS_RANGE, tabName: 'Leads' }),
    readTabRows({ sheetsClient, range: MEMBERS_RANGE, tabName: 'Members' }),
  ])

  return buildLeadsReview({
    parsedLeads: parseLeads({ rows: leadRows }),
    memberEmailIndex: buildMemberEmailIndex({ rows: memberRows }),
  })
}
