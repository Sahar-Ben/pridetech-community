import { parseLeads } from './parseLeads'
import type { Lead } from './lead'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* Status was added by hand at column K, past the form's own columns, so the read
   has to reach beyond them. */
export const LEADS_RANGE = 'Leads!A1:Z'

export const loadLeads = async ({
  sheetsClient,
}: {
  sheetsClient: SheetsClient
}): Promise<Lead[]> => {
  const rows = await sheetsClient.readRange({ range: LEADS_RANGE })
  return parseLeads({ rows })
}
