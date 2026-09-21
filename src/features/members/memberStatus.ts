import { isActiveMemberMatch, type MemberMatch } from '../applications/memberEmailIndex'
import type { MemberStatus } from './member'

/* The directory and the review queue have to agree about who is still a member,
   so there is one rule and it lives in `isActiveMemberMatch`, which carries the
   reasoning for why a blank `Status` on this sheet reads as Active rather than
   as departed. That rule consults the status cell and nothing else; the rest of
   the match is spelled out here as empty so it is plain that nothing else is
   being asked. */
const asStatusOnlyMatch = (status: string | undefined): MemberMatch => ({
  rowNumber: 0,
  emailKey: '',
  name: undefined,
  status,
  removalReason: undefined,
  approvedAt: undefined,
})

export const toMemberStatus = (statusCell: string | undefined): MemberStatus =>
  isActiveMemberMatch(asStatusOnlyMatch(statusCell)) ? 'Active' : 'Ex-member'
