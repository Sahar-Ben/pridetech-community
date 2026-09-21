import type { DuplicateApplicant } from './duplicateApplicants'
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
export const describeQueueCount = ({ counts }: { counts: LeadsReviewCounts }): string => {
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
