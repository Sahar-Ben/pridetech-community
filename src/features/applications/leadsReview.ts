import { groupDuplicateApplicants, type DuplicateApplicant } from './duplicateApplicants'
import type { Lead } from './lead'
import { isActiveMemberMatch, type MemberEmailIndex, type MemberMatch } from './memberEmailIndex'
import type { LeadWithoutEmail, ParsedLeads } from './parseLeads'

/* `priorMember` is the row an ex-member already has on the Members tab. It rides
   along with the application because approving one of these reactivates that row
   instead of appending a new one, and the reviewer has to know which of the two
   acts they are about to perform before they perform it. */
export type WaitingApplication = {
  lead: Lead
  priorMember: MemberMatch | undefined
}

export type AlreadyMemberLead = {
  lead: Lead
  member: MemberMatch
}

export type LeadsReviewCounts = {
  waitingCount: number
  alreadyMemberCount: number
  leadsWithoutEmailCount: number
  membersWithoutEmailCount: number
  repeatedLeadEmailCount: number
}

export type LeadsReview = {
  waitingApplications: readonly WaitingApplication[]
  alreadyMemberLeads: readonly AlreadyMemberLead[]
  leadsWithoutEmail: readonly LeadWithoutEmail[]
  duplicateApplicants: readonly DuplicateApplicant[]
  counts: LeadsReviewCounts
}

const bySheetRow = <T extends { rowNumber: number }>(earlier: T, later: T): number =>
  earlier.rowNumber - later.rowNumber

/* `Status` was added to the Leads tab by hand and is blank on every historical
   row, so a blank status alone cannot mean "waiting": an application whose email
   belongs to an active member was dealt with years ago. The excluded leads are
   returned alongside the waiting ones because the counts are drawn from the
   partition: a queue cannot report what it removed without holding on to it. */
export const buildLeadsReview = ({
  parsedLeads,
  memberEmailIndex,
}: {
  parsedLeads: ParsedLeads
  memberEmailIndex: MemberEmailIndex
}): LeadsReview => {
  const undecidedLeads = parsedLeads.leads.filter((lead) => lead.status === 'pending')

  const waitingApplications = undecidedLeads
    .flatMap((lead) => {
      const member = memberEmailIndex.matchByEmail.get(lead.email)
      if (member !== undefined && isActiveMemberMatch(member)) {
        return []
      }
      return [{ lead, priorMember: member }]
    })
    .toSorted((earlier, later) => bySheetRow(earlier.lead, later.lead))

  const alreadyMemberLeads = undecidedLeads
    .flatMap((lead) => {
      const member = memberEmailIndex.matchByEmail.get(lead.email)
      if (member === undefined || !isActiveMemberMatch(member)) {
        return []
      }
      return [{ lead, member }]
    })
    .toSorted((earlier, later) => bySheetRow(earlier.lead, later.lead))

  const duplicateApplicants = groupDuplicateApplicants({ leads: parsedLeads.leads })

  return {
    waitingApplications,
    alreadyMemberLeads,
    leadsWithoutEmail: parsedLeads.rowsWithoutEmail,
    duplicateApplicants,
    counts: {
      waitingCount: waitingApplications.length,
      alreadyMemberCount: alreadyMemberLeads.length,
      leadsWithoutEmailCount: parsedLeads.rowsWithoutEmail.length,
      membersWithoutEmailCount: memberEmailIndex.membersWithoutEmailCount,
      repeatedLeadEmailCount: duplicateApplicants.length,
    },
  }
}
