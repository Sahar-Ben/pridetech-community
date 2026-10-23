import type { Lead, LeadStatus } from './lead'
import { toApplicationDate } from '../overview/applicationTimestamp'

/* Newest submission first. The Timestamp column decides across days, so a
   sheet somebody re-sorted by hand still lists the latest applicant on top;
   within one day -- the column is only read to the day -- the later row wins,
   because the form appends every submission at the bottom. A row whose
   timestamp cannot be read goes after every dated one rather than being
   guessed into place. */
export const newestFirst = (first: Lead, second: Lead): number => {
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

const DECIDED_STATUSES: ReadonlySet<LeadStatus> = new Set(['approved', 'declined', 'maybe'])

/* One person, however many times they sent the form. `lead` is the row the
   app shows and writes a decision into: their newest submission, so a
   decision always lands on the row that decides them, and the next read shows
   it. `earlierDecision` is the newest decision on any of their older rows, so
   somebody declined before who asks again says so on their card. */
export type Applicant = {
  lead: Lead
  submissionCount: number
  earlierDecision: LeadStatus | undefined
}

const groupByEmail = (leads: readonly Lead[]): ReadonlyMap<string, Lead[]> =>
  leads.reduce((leadsByEmail, lead) => {
    const alreadyGrouped = leadsByEmail.get(lead.email)
    if (alreadyGrouped === undefined) {
      leadsByEmail.set(lead.email, [lead])
    } else {
      alreadyGrouped.push(lead)
    }
    return leadsByEmail
  }, new Map<string, Lead[]>())

/* Rows marked Duplicate by hand, or by this app before it grouped, still count
   as submissions but are never the row shown: whoever marked them chose the
   other row to keep. */
export const groupSubmissionsByApplicant = (leads: readonly Lead[]): readonly Applicant[] =>
  [...groupByEmail(leads).values()].flatMap((submissions) => {
    const newestFirstSubmissions = submissions.toSorted(newestFirst)
    const shown =
      newestFirstSubmissions.find((submission) => submission.status !== 'duplicate') ??
      newestFirstSubmissions[0]
    if (shown === undefined) {
      return []
    }
    const earlierDecision = newestFirstSubmissions
      .filter((submission) => submission !== shown)
      .find((submission) => DECIDED_STATUSES.has(submission.status))?.status
    return [{ lead: shown, submissionCount: submissions.length, earlierDecision }]
  })
