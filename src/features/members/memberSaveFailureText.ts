import type { Member } from './member'
import { describeSheetsFailureCause } from '../../sheets/sheetsFailureCause'

/* Named, because an organiser can have a member open while somebody else is
   editing another one, and "the save failed" leaves them guessing which record
   is now out of step with the sheet. A row with neither a name nor an address
   is still a row, and it is still theirs to fix. */
const describeMember = (member: Member): string => {
  if (member.name !== '') {
    return member.name
  }
  return member.mail === '' ? `the member on row ${member.rowNumber}` : member.mail
}

export const describeMemberSaveFailure = ({
  member,
  error,
}: {
  member: Member
  error: unknown
}): string => `${describeMember(member)} was not saved. ${describeSheetsFailureCause(error)}`
