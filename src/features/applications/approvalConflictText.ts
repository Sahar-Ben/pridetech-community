import type { MemberMatch } from './memberEmailIndex'
import { MEMBERS_TAB_NAME } from './sheetTabs'

const joinWithAnd = (parts: readonly string[]): string => {
  const lastPart = parts.at(-1)
  if (lastPart === undefined) {
    return ''
  }
  const earlierParts = parts.slice(0, -1)
  if (earlierParts.length === 0) {
    return lastPart
  }
  return `${earlierParts.join(', ')} and ${lastPart}`
}

export const listMemberRowNumbers = (matches: readonly MemberMatch[]): string => {
  if (matches.length === 0) {
    throw new Error('A message about member rows needs at least one row to name')
  }
  const rowNumbers = matches.map((match) => String(match.rowNumber))
  return `${matches.length === 1 ? 'row' : 'rows'} ${joinWithAnd(rowNumbers)}`
}

/* Names the headings to type rather than only reporting that something is
   missing, because the reviewer is midway through adding them by hand and the
   spelling is the whole difference. It also says what still works: only a
   returning member needs these columns, so a reviewer who reads this as "the
   queue is broken" would stop approving newcomers for no reason. */
export const describeMissingHistoryColumns = ({
  missingLabels,
}: {
  missingLabels: readonly string[]
}): string =>
  `This applicant was a member before, and bringing them back needs a column the ${MEMBERS_TAB_NAME} tab does not have yet: ${joinWithAnd([...missingLabels])}. Nothing was written. Add ${missingLabels.length === 1 ? 'that heading' : 'those headings'} to the right of Approved at, spelled exactly like that, then reload. Only a returning member needs ${missingLabels.length === 1 ? 'it' : 'them'}, so the rest of the queue is unaffected.`

/* The rows are named because the reviewer is the only one who can fix this: the
   app cannot tell which of two rows sharing an address is the person in front of
   it, and guessing leaves one member on two Active rows, which halves every
   attendance figure matched on that address. */
export const describeDuplicateMemberRows = ({
  emailKey,
  matches,
}: {
  emailKey: string
  matches: readonly MemberMatch[]
}): string =>
  `${emailKey} is on more than one ${MEMBERS_TAB_NAME} row \u{2014} ${listMemberRowNumbers(matches)}. Nothing was written, because approving would have to pick one of them. Merge or correct those rows in the sheet, then reload the applications.`

/* Said only when the member row is somebody other than this applicant, which is
   the case this refusal exists for: a couple or a team sharing one inbox. It
   never claims the approval was pointless, because the person in front of the
   reviewer may genuinely have no member row of their own. */
export const describeAddressTakenByAnotherMember = ({
  member,
  emailKey,
}: {
  member: MemberMatch
  emailKey: string
}): string =>
  `${emailKey} already belongs to an active member, ${member.name ?? 'an unnamed row'} on ${MEMBERS_TAB_NAME} row ${member.rowNumber}, and this application is from somebody else. Nothing was written: two people on one address cannot be told apart by anything in the sheet. Give this applicant their own address, or add their member row by hand, then mark this application in the sheet.`

/* The application this reviewer is looking at has already been decided by
   somebody, or by them: there is a member row and a Status on the lead. */
export const describeAlreadyDecided = ({
  member,
  recordedStatus,
}: {
  member: MemberMatch
  recordedStatus: string
}): string =>
  `${member.name ?? member.emailKey} is already an active member, on ${MEMBERS_TAB_NAME} row ${member.rowNumber}, and this application is already marked ${recordedStatus}. Nothing was written \u{2014} reload the applications, because this one should not be in the queue.`
