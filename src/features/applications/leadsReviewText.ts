import type { LeadStatus } from './lead'
import type { LeadView } from './leadViews'
import type { LeadsReviewCounts } from './leadsReview'
import type { LeadWithoutEmail } from './parseLeads'

const SEPARATOR = ' \u{00b7} '

const countPhrase = ({
  count,
  singular,
  plural,
}: {
  count: number
  singular: string
  plural: string
}): string => `${count} ${count === 1 ? singular : plural}`

/* Both halves are shown together on purpose: a queue that quietly dropped two
   thirds of the sheet is indistinguishable from a broken filter unless the
   number it removed is on screen next to the number it kept. The second half
   counts Leads rows, not people, and repeat applicants make it larger than the
   Members tab is long, so it must never be worded as a headcount. */
const describePendingCount = ({ counts }: { counts: LeadsReviewCounts }): string | undefined => {
  if (counts.waitingCount + counts.alreadyMemberCount === 0) {
    return undefined
  }
  const waiting = `${counts.waitingCount} waiting`
  if (counts.alreadyMemberCount === 0) {
    return waiting
  }
  const alreadyMembers = countPhrase({
    count: counts.alreadyMemberCount,
    singular: 'application from an existing member',
    plural: 'applications from existing members',
  })
  return `${waiting}${SEPARATOR}${alreadyMembers}`
}

/* One number, and not the queue's second one. The already-a-member count says
   how many waiting applications the filter set aside, which is a fact about the
   queue: repeated over a list of decided applications it would read as a count
   of them, and it counts none of them. */
const describeDecidedCount = ({
  count,
  word,
}: {
  count: number
  word: string
}): string | undefined => {
  if (count === 0) {
    return undefined
  }
  return `${count} ${word}`
}

/* Undefined rather than a zero: an empty view already says so in words below,
   and `0 waiting` above it would be the same sentence twice. */
const DESCRIBE_COUNT: Readonly<
  Record<LeadView, (counts: LeadsReviewCounts) => string | undefined>
> = {
  Pending: (counts) => describePendingCount({ counts }),
  Maybe: (counts) => describeDecidedCount({ count: counts.maybeCount, word: 'kept for later' }),
  Declined: (counts) => describeDecidedCount({ count: counts.declinedCount, word: 'declined' }),
}

export const describeApplicationsCount = ({
  view,
  counts,
}: {
  view: LeadView
  counts: LeadsReviewCounts
}): string | undefined => DESCRIBE_COUNT[view](counts)

/* Each view names itself when it is empty. All three are legitimately empty
   — a queue that has been worked through, a sheet nobody has been declined
   on, a reviewer who decides everything as they read it — and a shared
   "nothing here" would leave them unable to tell which they were looking at. */
const EMPTY_VIEW_SENTENCES: Readonly<Record<LeadView, string>> = {
  Pending: 'No applications waiting for review.',
  Maybe: 'No applications are being kept for later.',
  Declined: 'No applications have been declined.',
}

export const describeEmptyView = ({ view }: { view: LeadView }): string =>
  EMPTY_VIEW_SENTENCES[view]

/* Each note is its own function rather than one list of strings: the one that
   names Leads rows opens a list of those rows, and a caller cannot attach a list
   to a sentence it can only tell apart by reading it. */
export const describeLeadsWithoutEmailNote = ({ count }: { count: number }): string | undefined => {
  if (count === 0) {
    return undefined
  }
  const applications = countPhrase({
    count,
    singular: 'application has',
    plural: 'applications have',
  })
  const pronoun = count === 1 ? 'it' : 'they'
  return `${applications} no email address, so ${pronoun} cannot be matched against the Members tab.`
}

export const describeMembersWithoutEmailNote = ({
  count,
}: {
  count: number
}): string | undefined => {
  if (count === 0) {
    return undefined
  }
  const memberRows = countPhrase({
    count,
    singular: 'member row has',
    plural: 'member rows have',
  })
  return `${memberRows} no email address, so an application from them stays in the queue.`
}

export const describeLeadWithoutEmail = ({
  leadWithoutEmail,
}: {
  leadWithoutEmail: LeadWithoutEmail
}): string =>
  [`Leads row ${leadWithoutEmail.rowNumber}`, leadWithoutEmail.name]
    .filter((part) => part !== undefined)
    .join(SEPARATOR)

const EARLIER_DECISION_PHRASE: Readonly<Partial<Record<LeadStatus, string>>> = {
  approved: 'approved before',
  declined: 'declined before',
  maybe: 'kept for later before',
}

/* Undefined for somebody who sent the form once, which is nearly everybody:
   the line is there to say a card stands for more than one row. */
export const describeSubmissions = ({
  submissionCount,
  earlierDecision,
}: {
  submissionCount: number
  earlierDecision: LeadStatus | undefined
}): string | undefined => {
  if (submissionCount < 2) {
    return undefined
  }
  const earlier = earlierDecision === undefined ? undefined : EARLIER_DECISION_PHRASE[earlierDecision]
  return [`Submitted ${submissionCount} times`, earlier]
    .filter((part) => part !== undefined)
    .join(SEPARATOR)
}
