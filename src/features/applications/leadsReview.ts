import { groupDuplicateApplicants, type DuplicateApplicant } from './duplicateApplicants'
import type { Lead, LeadStatus } from './lead'
import { isActiveMemberMatch, type MemberEmailIndex, type MemberMatch } from './memberEmailIndex'
import type { LeadWithoutEmail, ParsedLeads } from './parseLeads'
import { toApplicationDate } from '../overview/applicationTimestamp'

/* `priorMember` is the row an ex-member already has on the Members tab. It rides
   along with the application because approving one of these reactivates that row
   instead of appending a new one, and the reviewer has to know which of the two
   acts they are about to perform before they perform it. */
export type ReviewableApplication = {
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
  maybeCount: number
  declinedCount: number
  leadsWithoutEmailCount: number
  membersWithoutEmailCount: number
  repeatedLeadEmailCount: number
}

export type LeadsReview = {
  waitingApplications: readonly ReviewableApplication[]
  maybeApplications: readonly ReviewableApplication[]
  declinedApplications: readonly ReviewableApplication[]
  alreadyMemberLeads: readonly AlreadyMemberLead[]
  leadsWithoutEmail: readonly LeadWithoutEmail[]
  duplicateApplicants: readonly DuplicateApplicant[]
  counts: LeadsReviewCounts
}

/* Newest submission first. The Timestamp column decides across days, so a
   sheet somebody re-sorted by hand still lists the latest applicant on top;
   within one day -- the column is only read to the day -- the later row wins,
   because the form appends every submission at the bottom. A row whose
   timestamp cannot be read goes after every dated one rather than being
   guessed into place. */
const newestFirst = (first: Lead, second: Lead): number => {
  const firstTime = toApplicationDate(first.timestamp)?.getTime()
  const secondTime = toApplicationDate(second.timestamp)?.getTime()
  if (firstTime !== secondTime) {
    if (firstTime === undefined) {
      return 1
    }
    if (secondTime === undefined) {
      return -1
    }
    return secondTime - firstTime
  }
  return second.rowNumber - first.rowNumber
}

/* An active member row is not a prior record to bring back, so it is not offered
   as one: the notice promises a reactivation, and approving against an active row
   writes no member row at all. A declined applicant whose address is on an active
   row is still listed — the refusal that meets them names the row — because
   dropping them would leave a decision nobody could revisit. */
const priorMemberOf = ({
  lead,
  memberEmailIndex,
}: {
  lead: Lead
  memberEmailIndex: MemberEmailIndex
}): MemberMatch | undefined => {
  const member = memberEmailIndex.matchByEmail.get(lead.email)
  if (member === undefined || isActiveMemberMatch(member)) {
    return undefined
  }
  return member
}

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
    .toSorted((first, second) => newestFirst(first.lead, second.lead))

  const alreadyMemberLeads = undecidedLeads
    .flatMap((lead) => {
      const member = memberEmailIndex.matchByEmail.get(lead.email)
      if (member === undefined || !isActiveMemberMatch(member)) {
        return []
      }
      return [{ lead, member }]
    })
    .toSorted((first, second) => newestFirst(first.lead, second.lead))

  /* Declined rows are the one decided state the app offers a way back from, so
     they are carried whole rather than counted: approving one of them is the
     reason to open the list at all. Approved rows are not, and must not be —
     824 of them would turn a work queue into a browser of the Members tab. */
  const applicationsWithStatus = (status: LeadStatus): readonly ReviewableApplication[] =>
    parsedLeads.leads
      .filter((lead) => lead.status === status)
      .map((lead) => ({ lead, priorMember: priorMemberOf({ lead, memberEmailIndex }) }))
      .toSorted((first, second) => newestFirst(first.lead, second.lead))

  const declinedApplications = applicationsWithStatus('declined')

  /* Kept for later is a decision like the other two, so it leaves the queue the
     same way -- but it is the one decision taken with the intention of coming
     back to it, so the applications are carried whole rather than counted. */
  const maybeApplications = applicationsWithStatus('maybe')

  const duplicateApplicants = groupDuplicateApplicants({ leads: parsedLeads.leads })

  return {
    waitingApplications,
    maybeApplications,
    declinedApplications,
    alreadyMemberLeads,
    leadsWithoutEmail: parsedLeads.rowsWithoutEmail,
    duplicateApplicants,
    counts: {
      waitingCount: waitingApplications.length,
      alreadyMemberCount: alreadyMemberLeads.length,
      maybeCount: maybeApplications.length,
      declinedCount: declinedApplications.length,
      leadsWithoutEmailCount: parsedLeads.rowsWithoutEmail.length,
      membersWithoutEmailCount: memberEmailIndex.membersWithoutEmailCount,
      repeatedLeadEmailCount: duplicateApplicants.length,
    },
  }
}
