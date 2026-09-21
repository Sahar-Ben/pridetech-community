import type { Member } from './member'
import { toMemberStatus } from './memberStatus'
import {
  readMemberCell,
  type MemberCellWrite,
  type MemberColumnTarget,
} from '../applications/memberSheetColumns'

type EditableColumn = {
  target: MemberColumnTarget
  readValue: (member: Member) => string | undefined
}

/* `Approved at` is absent because it records when this person joined, and
   `Previous removal reason` and `Rejoined at` are absent because the approval
   flow writes them when somebody comes back. A directory edit that touched any
   of the three would overwrite a history nothing else can reconstruct.
   `Status` is absent too, but only from here: it is the one field whose cell
   cannot be compared as text, and it is handled on its own below. */
const EDITABLE_TEXT_COLUMNS: readonly EditableColumn[] = [
  { target: 'name', readValue: (member) => member.name },
  { target: 'company', readValue: (member) => member.company },
  { target: 'title', readValue: (member) => member.title },
  { target: 'mail', readValue: (member) => member.mail },
  { target: 'phone', readValue: (member) => member.phone },
  { target: 'city', readValue: (member) => member.city },
  { target: 'linkedIn', readValue: (member) => member.linkedIn },
  { target: 'interests', readValue: (member) => member.interests },
  { target: 'shirtSize', readValue: (member) => member.shirtSize },
  { target: 'notes', readValue: (member) => member.notes },
  { target: 'informedForMembership', readValue: (member) => member.informedForMembership },
  { target: 'gender', readValue: (member) => member.gender },
  { target: 'removalReason', readValue: (member) => member.removalReason },
]

/* Two questions, and a cell is written only if both say yes.

   Did the organiser change this field? A field they never opened is left alone
   whatever the cell holds, so a gender or a removal reason this app does not
   recognise cannot be blanked by somebody correcting a phone number.

   Does the cell still disagree? If another organiser has already made the same
   change, there is nothing left to write. Every value the app sends back
   arrived through one FORMATTED_VALUE read, so a cell rewritten with what it
   already says is a round trip that can only lose something. */
export const buildMemberEditWrites = ({
  originalMember,
  updatedMember,
  membersHeaderRow,
  existingRow,
}: {
  originalMember: Member
  updatedMember: Member
  membersHeaderRow: readonly string[]
  existingRow: readonly string[]
}): readonly MemberCellWrite[] => {
  const recorded = (target: MemberColumnTarget): string =>
    readMemberCell({ membersHeaderRow, row: existingRow, target }) ?? ''

  const changedText = ({ target, readValue }: EditableColumn): MemberCellWrite[] => {
    const value = readValue(updatedMember) ?? ''
    if (value === (readValue(originalMember) ?? '') || value === recorded(target)) {
      return []
    }
    return [{ target, value }]
  }

  /* Status is compared as the status it means, not as the text in the cell.
     Blank means Active on 787 rows, so comparing text would write the word
     `Active` into every one of them the first time anybody edited anything. */
  const changedStatus = (): MemberCellWrite[] => {
    const { status } = updatedMember
    if (status === originalMember.status || status === toMemberStatus(recorded('status'))) {
      return []
    }
    return [{ target: 'status', value: status }]
  }

  return [...changedStatus(), ...EDITABLE_TEXT_COLUMNS.flatMap(changedText)]
}
