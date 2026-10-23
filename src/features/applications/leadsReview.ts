import type { Lead, LeadStatus } from './lead'
import { groupSubmissionsByApplicant, newestFirst, type Applicant } from './leadSubmissions'
import { isActiveMemberMatch, type MemberEmailIndex, type MemberMatch } from './memberEmailIndex'
import type { LeadWithoutEmail, ParsedLeads } from './parseLeads'

/* `priorMember` is the row an ex-member already has on the Members tab. It rides
   along with the application because approving one of these reactivates that row
   instead of appending a new one, and the reviewer has to know which of the two
   acts they are about to perform before they perform it. `lead` is the
   person's newest submission; the count and the earlier decision come from
   `groupSubmissionsByApplicant`. */
export type ReviewableApplication = Applicant & {
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
  counts: LeadsReviewCounts
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
   partition: a queue cannot report what it removed without holding on to it.

   Everything below is one entry per person, not per row: somebody who sent the
   form three times is one card that says so, decided by their newest
   submission's Status. */
export const buildLeadsReview = ({
  parsedLeads,
  memberEmailIndex,
}: {
  parsedLeads: ParsedLeads
  memberEmailIndex: MemberEmailIndex
}): LeadsReview => {
  const applicants = groupSubmissionsByApplicant(parsedLeads.leads)
  const undecidedApplicants = applicants.filter(({ lead }) => lead.status === 'pending')

  const waitingApplications = undecidedApplicants
    .flatMap((applicant) => {
      const member = memberEmailIndex.matchByEmail.get(applicant.lead.email)
      if (member !== undefined && isActiveMemberMatch(member)) {
        return []
      }
      return [{ ...applicant, priorMember: member }]
    })
    .toSorted((first, second) => newestFirst(first.lead, second.lead))

  const alreadyMemberLeads = undecidedApplicants
    .flatMap(({ lead }) => {
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
    applicants
      .filter(({ lead }) => lead.status === status)
      .map((applicant) => ({
        ...applicant,
        priorMember: priorMemberOf({ lead: applicant.lead, memberEmailIndex }),
      }))
      .toSorted((first, second) => newestFirst(first.lead, second.lead))

  const declinedApplications = applicationsWithStatus('declined')

  /* Kept for later is a decision like the other two, so it leaves the queue the
     same way -- but it is the one decision taken with the intention of coming
     back to it, so the applications are carried whole rather than counted. */
  const maybeApplications = applicationsWithStatus('maybe')

  return {
    waitingApplications,
    maybeApplications,
    declinedApplications,
    alreadyMemberLeads,
    leadsWithoutEmail: parsedLeads.rowsWithoutEmail,
    counts: {
      waitingCount: waitingApplications.length,
      alreadyMemberCount: alreadyMemberLeads.length,
      maybeCount: maybeApplications.length,
      declinedCount: declinedApplications.length,
      leadsWithoutEmailCount: parsedLeads.rowsWithoutEmail.length,
      membersWithoutEmailCount: memberEmailIndex.membersWithoutEmailCount,
      repeatedLeadEmailCount: applicants.filter(({ submissionCount }) => submissionCount > 1).length,
    },
  }
}
