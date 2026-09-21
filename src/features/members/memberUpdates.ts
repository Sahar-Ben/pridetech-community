import type { Member } from './member'

export const replaceMember = ({
  members,
  updatedMember,
}: {
  members: readonly Member[]
  updatedMember: Member
}): readonly Member[] =>
  members.map((member) => (member.rowNumber === updatedMember.rowNumber ? updatedMember : member))
