import type { Lead } from '../features/applications/lead'
import { buildLeadsReview, type LeadsReview } from '../features/applications/leadsReview'
import { buildMemberEmailIndex } from '../features/applications/memberEmailIndex'
import type { LeadWithoutEmail } from '../features/applications/parseLeads'
import { MEMBERS_HEADER_ROW } from './sheetsClientFactory'

/* Component tests build their review through the real matching functions rather
   than hand-assembling one, so a test can never claim a pairing the filter would
   not actually make. */
export const buildLeadsReviewFixture = ({
  leads = [],
  memberRows = [],
  rowsWithoutEmail = [],
}: {
  leads?: readonly Lead[]
  memberRows?: readonly string[][]
  rowsWithoutEmail?: readonly LeadWithoutEmail[]
} = {}): LeadsReview =>
  buildLeadsReview({
    parsedLeads: { leads, rowsWithoutEmail },
    memberEmailIndex: buildMemberEmailIndex({ rows: [MEMBERS_HEADER_ROW, ...memberRows] }),
  })
