import { doesMemberMatchName, type MemberMatch } from './memberEmailIndex'
import { readMemberCell } from './memberSheetColumns'
import { buildMemberRowRange, MEMBERS_HEADER_RANGE, MEMBERS_TAB_NAME } from './sheetTabs'
import { toEmailKey } from '../../sheets/emailKey'
import type { SheetsClient } from '../../sheets/sheetsClient'

export type VerifiedMemberRow = {
  membersHeaderRow: readonly string[]
  existingRow: readonly string[]
}

/* An empty expected key is a member row whose `Mail` cell is blank. The
   applications path cannot produce one, because it indexes the tab by address,
   but the directory can: those rows are on the sheet and they can be edited.
   The row has to still be blank there for it to be the same record, so the
   absence is checked as strictly as a match would be. */
const doesMailStillMatch = ({
  recordedMail,
  expectedEmailKey,
}: {
  recordedMail: string | undefined
  expectedEmailKey: string
}): boolean => {
  if (expectedEmailKey === '') {
    return recordedMail === undefined
  }
  return recordedMail !== undefined && toEmailKey(recordedMail) === expectedEmailKey
}

/* Member row numbers go stale exactly the way lead row numbers do: the Members
   tab is hand-maintained, and a row inserted above this one turns an update into
   an overwrite of somebody else's record. The row is read back and checked
   immediately before it is rewritten, and the header comes back in the same
   breath so the rewrite places values by the layout the sheet has now.

   Three fields are checked, not one. The address on its own is not an identity
   here either: the same address is on this tab more than once, and it is shared
   by couples and by teams, so a row that still answers to it can be a different
   record from the one that was read. `Name` and `Approved at` are the other two
   the read already carries, and between the read of the tab and this read of the
   row there is a window in which somebody can delete a row above. */
export const readVerifiedMemberRow = async ({
  sheetsClient,
  expectedMember,
}: {
  sheetsClient: SheetsClient
  expectedMember: MemberMatch
}): Promise<VerifiedMemberRow> => {
  const { rowNumber } = expectedMember
  const [headerRows, memberRows] = await Promise.all([
    sheetsClient.readRange({ range: MEMBERS_HEADER_RANGE }),
    sheetsClient.readRange({ range: buildMemberRowRange(rowNumber) }),
  ])

  const membersHeaderRow = headerRows[0]
  if (membersHeaderRow === undefined) {
    throw new Error(
      `The ${MEMBERS_TAB_NAME} tab has no header row to read \u{2014} nothing was written.`,
    )
  }

  const existingRow = memberRows[0] ?? []
  const recordedCell = (target: 'mail' | 'name' | 'approvedAt'): string | undefined =>
    readMemberCell({ membersHeaderRow, row: existingRow, target })

  const doesRowStillHoldThisMember =
    doesMailStillMatch({
      recordedMail: recordedCell('mail'),
      expectedEmailKey: expectedMember.emailKey,
    }) &&
    doesMemberMatchName({ member: expectedMember, name: recordedCell('name') }) &&
    recordedCell('approvedAt') === expectedMember.approvedAt

  if (!doesRowStillHoldThisMember) {
    throw new Error(
      `The ${MEMBERS_TAB_NAME} tab changed while you were reviewing: row ${rowNumber} no longer holds the member record this application was matched to. Nothing was written \u{2014} reload the applications before deciding anything else.`,
    )
  }

  return { membersHeaderRow, existingRow }
}
