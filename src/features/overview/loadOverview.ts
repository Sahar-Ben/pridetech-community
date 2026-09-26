import { buildOverview, type Overview } from './buildOverview'
import { parseLeads } from '../applications/parseLeads'
import {
  LEADS_RANGE,
  LEADS_TAB_NAME,
  MEMBERS_RANGE,
  MEMBERS_TAB_NAME,
} from '../applications/sheetTabs'
import { parseMembers } from '../members/parseMembers'
import { readTabRows } from '../../sheets/readTabRows'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* Both tabs, and either failing fails the dashboard. The Members tab alone
   would still draw four of the five charts, with every member banded as having
   no application — a tenure chart that is entirely "unknown" and looks like a
   finding rather than a failed read. */
export const loadOverview = async ({
  sheetsClient,
  asOf,
}: {
  sheetsClient: SheetsClient
  asOf: Date
}): Promise<Overview> => {
  const [memberRows, leadRows] = await Promise.all([
    readTabRows({ sheetsClient, range: MEMBERS_RANGE, tabName: MEMBERS_TAB_NAME }),
    readTabRows({ sheetsClient, range: LEADS_RANGE, tabName: LEADS_TAB_NAME }),
  ])

  return buildOverview({
    members: parseMembers({ rows: memberRows }),
    leads: parseLeads({ rows: leadRows }).leads,
    asOf,
  })
}
