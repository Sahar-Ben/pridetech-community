import { formatOtherEmails, parseOtherEmails, type Member } from './member'
import { toExpectedMemberRow } from './saveMemberEdit'
import { doesEmailMatch } from '../events/emailMatch'
import { buildMemberCellWrites, readMemberCell } from '../applications/memberSheetColumns'
import { readVerifiedMemberRow } from '../applications/readVerifiedMemberRow'
import { MEMBERS_TAB_NAME } from '../applications/sheetTabs'
import { buildCellRange } from '../../sheets/a1Range'
import { buildHeaderMap, findColumn } from '../../sheets/headerMap'
import { COLUMN_ALIASES } from '../../sheets/columnAliases'
import type { CellWrite, SheetsClient } from '../../sheets/sheetsClient'

/* What the organiser chose to do with the address somebody registered with.
   `add` keeps the member's main address and records this one beside it, so
   both match from now on. `replace` makes it their main address, for when the
   one on file is wrong or no longer read. */
export type EmailLinkMode = 'add' | 'replace'

export const OTHER_EMAILS_HEADING = 'Other emails'

/* The Members tab is read as A to Z, so a heading written past Z would never be
   read back, and every address added under it would quietly match nobody. */
const LAST_READ_COLUMN_INDEX = 25

const locateOtherEmailsColumn = (membersHeaderRow: readonly string[]): number | undefined =>
  findColumn({ headerMap: buildHeaderMap(membersHeaderRow), aliases: COLUMN_ALIASES.otherEmails })

/* The column is created the first time somebody needs it, in the first free
   cell after the last heading, and nowhere else in the tab is touched. */
const buildOtherEmailsWrites = ({
  membersHeaderRow,
  existingRow,
  rowNumber,
  email,
}: {
  membersHeaderRow: readonly string[]
  existingRow: readonly string[]
  rowNumber: number
  email: string
}): readonly CellWrite[] => {
  const recordedColumn = locateOtherEmailsColumn(membersHeaderRow)
  const columnIndex = recordedColumn ?? membersHeaderRow.length
  if (columnIndex > LAST_READ_COLUMN_INDEX) {
    throw new Error(
      `The ${MEMBERS_TAB_NAME} tab has no free column for "${OTHER_EMAILS_HEADING}" \u{2014} nothing was written. Add that heading to a column between A and Z, then try again.`,
    )
  }

  /* The cell as it is now, not as it was when the list was read: somebody may
     have typed another address into it since, and it has to survive. */
  const recordedEmails = parseOtherEmails(
    recordedColumn === undefined ? undefined : existingRow[recordedColumn],
  )
  const headingWrites: readonly CellWrite[] =
    recordedColumn === undefined
      ? [
          {
            range: buildCellRange({ tabName: MEMBERS_TAB_NAME, columnIndex, rowNumber: 1 }),
            value: OTHER_EMAILS_HEADING,
          },
        ]
      : []
  return [
    ...headingWrites,
    {
      range: buildCellRange({ tabName: MEMBERS_TAB_NAME, columnIndex, rowNumber }),
      value: formatOtherEmails([...recordedEmails, email]),
    },
  ]
}

/* An address the row already answers to needs nothing written: adding it twice
   would only make the cell longer, and replacing the main address with itself
   changes nothing. */
const doesRowAlreadyHaveEmail = ({
  membersHeaderRow,
  existingRow,
  email,
  mode,
}: {
  membersHeaderRow: readonly string[]
  existingRow: readonly string[]
  email: string
  mode: EmailLinkMode
}): boolean => {
  const mail = readMemberCell({ membersHeaderRow, row: existingRow, target: 'mail' }) ?? ''
  if (doesEmailMatch({ left: mail, right: email })) {
    return true
  }
  if (mode === 'replace') {
    return false
  }
  const otherColumn = locateOtherEmailsColumn(membersHeaderRow)
  const otherEmails = parseOtherEmails(otherColumn === undefined ? undefined : existingRow[otherColumn])
  return otherEmails.some((otherEmail) => doesEmailMatch({ left: otherEmail, right: email }))
}

/* The row is read back and checked to still be this member immediately before
   anything is written, the same check a member edit makes: the Members tab is
   kept by hand, and a row inserted above this one would otherwise put the
   address on somebody else. RAW, because an address is text and nothing else. */
export const linkEmailToMember = async ({
  sheetsClient,
  member,
  email,
  mode,
}: {
  sheetsClient: SheetsClient
  member: Member
  email: string
  mode: EmailLinkMode
}): Promise<void> => {
  const trimmedEmail = email.trim()
  const { membersHeaderRow, existingRow } = await readVerifiedMemberRow({
    sheetsClient,
    expectedMember: toExpectedMemberRow(member),
  })

  if (doesRowAlreadyHaveEmail({ membersHeaderRow, existingRow, email: trimmedEmail, mode })) {
    return
  }

  const writes =
    mode === 'replace'
      ? buildMemberCellWrites({
          membersHeaderRow,
          rowNumber: member.rowNumber,
          writes: [{ target: 'mail', value: trimmedEmail }],
        })
      : buildOtherEmailsWrites({
          membersHeaderRow,
          existingRow,
          rowNumber: member.rowNumber,
          email: trimmedEmail,
        })

  await sheetsClient.updateCells({ writes, valueInputOption: 'RAW' })
}
