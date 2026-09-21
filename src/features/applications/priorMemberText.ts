import type { MemberMatch } from './memberEmailIndex'

/* The reviewer is told which of the two acts they are about to perform before
   they perform it: approving a newcomer adds a row, approving a returning member
   rewrites the one they already have. */
export const describePriorMember = ({ priorMember }: { priorMember: MemberMatch }): string => {
  const status = priorMember.status === undefined ? '' : `, marked ${priorMember.status}`
  return `This applicant already has a member record on Members row ${priorMember.rowNumber}${status}. Approving brings it back to Active rather than adding a second row.`
}

/* Shown separately and never folded into the sentence above: somebody removed
   for a code-of-conduct reason reapplying is a decision the organiser has to
   make with that fact in front of them, not discover afterwards. */
export const describePriorMemberRemoval = ({
  priorMember,
}: {
  priorMember: MemberMatch
}): string | undefined =>
  priorMember.removalReason === undefined
    ? undefined
    : `Reason they were removed: ${priorMember.removalReason}`
