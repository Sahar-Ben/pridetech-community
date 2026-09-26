import type { DuplicateApplicant } from './duplicateApplicants'
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

/* Each note is its own function rather than one list of strings: the two that
   name Leads rows open a list of those rows, and a caller cannot attach a list
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

export const describeRepeatedEmailsNote = ({ count }: { count: number }): string | undefined => {
  if (count === 0) {
    return undefined
  }
  const addresses = countPhrase({
    count,
    singular: 'email address appears',
    plural: 'email addresses appear',
  })
  return `${addresses} on more than one application.`
}

export const describeLeadWithoutEmail = ({
  leadWithoutEmail,
}: {
  leadWithoutEmail: LeadWithoutEmail
}): string =>
  [`Leads row ${leadWithoutEmail.rowNumber}`, leadWithoutEmail.name]
    .filter((part) => part !== undefined)
    .join(SEPARATOR)

export const describeDuplicateNames = ({
  duplicate,
}: {
  duplicate: DuplicateApplicant
}): string =>
  duplicate.names.length === 0 ? duplicate.emailKey : duplicate.names.join(SEPARATOR)

export const describeDuplicateApplicant = ({
  duplicate,
}: {
  duplicate: DuplicateApplicant
}): string =>
  [
    duplicate.emailKey,
    `${duplicate.rowNumbers.length} applications`,
    `Leads rows ${duplicate.rowNumbers.join(', ')}`,
  ].join(SEPARATOR)

/* Silent above one name: the warning exists to stop a reviewer reading a shared
   inbox as one person applying twice, and on the far commoner repeat-application
   case it would be noise on every row. */
export const describeSharedAddressNote = ({
  duplicate,
}: {
  duplicate: DuplicateApplicant
}): string | undefined => {
  if (duplicate.names.length < 2) {
    return undefined
  }
  return `${duplicate.names.length} different names use this address, so these may be different people sharing an inbox rather than one person applying twice.`
}
