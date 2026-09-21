import type { Member } from './member'
import { buildMemberEditWrites } from './memberEditWrites'
import type { MemberMatch } from '../applications/memberEmailIndex'
import { buildMemberCellWrites } from '../applications/memberSheetColumns'
import { readVerifiedMemberRow } from '../applications/readVerifiedMemberRow'
import { toEmailKey } from '../../sheets/emailKey'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* The member as the organiser found them, which is what the row is checked
   against. Checking against the edit would ask whether the row already says
   what the edit is about to write, and every rename would look like the row
   having moved. */
const toExpectedRow = (member: Member): MemberMatch => ({
  rowNumber: member.rowNumber,
  emailKey: toEmailKey(member.mail),
  name: member.name,
  status: undefined,
  removalReason: undefined,
  approvedAt: member.approvedAt,
})

/* One request for the whole edit, and RAW for all of it.

   RAW because there is nothing here Sheets should re-read. Every field on this
   form was filled from a FORMATTED_VALUE read of the row and handed back by a
   person typing into it: `USER_ENTERED` would turn `+972-50-123-4567` into a
   negative number, drop the leading zero from `0501234567`, freeze a formula
   into whatever it displayed, and re-read a date in the spreadsheet's locale.
   The approval path splits its writes in two because it also composes a date
   that is worth storing as a date; this screen composes no such value, so the
   split would buy nothing and cost the edit its atomicity.

   One request because these cells are one person. Two requests can fail
   between them and leave a row that is half the member the organiser found and
   half the one they meant to save. */
export const saveMemberEdit = async ({
  sheetsClient,
  originalMember,
  updatedMember,
}: {
  sheetsClient: SheetsClient
  originalMember: Member
  updatedMember: Member
}): Promise<void> => {
  const { membersHeaderRow, existingRow } = await readVerifiedMemberRow({
    sheetsClient,
    expectedMember: toExpectedRow(originalMember),
  })

  const writes = buildMemberEditWrites({
    originalMember,
    updatedMember,
    membersHeaderRow,
    existingRow,
  })
  if (writes.length === 0) {
    return
  }

  await sheetsClient.updateCells({
    writes: buildMemberCellWrites({
      membersHeaderRow,
      rowNumber: originalMember.rowNumber,
      writes,
    }),
    valueInputOption: 'RAW',
  })
}
