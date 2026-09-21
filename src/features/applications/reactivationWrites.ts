import type { Gender } from './decision'
import { toGenderCell } from './genderCell'
import type { Lead } from './lead'
import {
  findMissingMemberColumns,
  readMemberCell,
  type MemberCellWrite,
  type MemberColumnTarget,
} from './memberSheetColumns'
import { describeMissingHistoryColumns } from './approvalConflictText'

const ACTIVE_MEMBER_STATUS = 'Active'

/* The two columns that make a rejoin non-destructive, and the only columns in
   this file that an approval can be missing. They are required here and nowhere
   else on purpose: a newcomer has no removal reason to preserve and no earlier
   join date to keep, so appending their row must go on working while the
   reviewer is still adding these headings to the tab by hand. */
const HISTORY_COLUMNS: readonly MemberColumnTarget[] = ['previousRemovalReason', 'rejoinedAt']

/* Refusing rather than skipping them. Skipping would write the reactivation
   anyway and drop the history on the floor, which is the exact loss these
   columns were added to prevent, and it would do it silently. */
const requireHistoryColumns = (membersHeaderRow: readonly string[]): void => {
  const missingLabels = findMissingMemberColumns({
    membersHeaderRow,
    targets: HISTORY_COLUMNS,
  })
  if (missingLabels.length > 0) {
    throw new Error(describeMissingHistoryColumns({ missingLabels }))
  }
}

/* Split by where the value came from, because that decides how Sheets is
   allowed to read it back. Everything sourced from the sheet - the application
   row as well as the member row - has already been through one FORMATTED_VALUE
   read and must be stored exactly as it stands; only what the reviewer chose or
   this app composed is safe to hand to Sheets as if a person had typed it. */
export type ReactivationWrites = {
  sheetSourcedWrites: readonly MemberCellWrite[]
  appComposedWrites: readonly MemberCellWrite[]
}

/* Event attendance is matched on email, so a returning member gets their old row
   back rather than a second one: two rows sharing an address would split one
   person's history between them and quietly halve every count drawn from it. */
export const buildReactivationWrites = ({
  lead,
  gender,
  membersHeaderRow,
  existingRow,
  approvedAt,
}: {
  lead: Lead
  gender: Gender
  membersHeaderRow: readonly string[]
  existingRow: readonly string[]
  approvedAt: string
}): ReactivationWrites => {
  requireHistoryColumns(membersHeaderRow)

  const recorded = (target: MemberColumnTarget): string =>
    readMemberCell({ membersHeaderRow, row: existingRow, target }) ?? ''

  /* A value the row already holds is not written at all. Rewriting a cell with
     what it already says is the read-then-write round trip this whole split
     exists to avoid, and it is the difference between a cell Sheets re-reads
     and a cell Sheets never touches. */
  const changing = (target: MemberColumnTarget, value: string): MemberCellWrite[] =>
    value === recorded(target) ? [] : [{ target, value }]

  /* A field the new application left blank keeps what the sheet already had:
     reapplying is not a statement that the old phone number is wrong. */
  const refreshed = (target: MemberColumnTarget, applied: string | undefined): MemberCellWrite[] =>
    changing(target, applied ?? recorded(target))

  /* Moved rather than copied-and-kept: only a reason that is there is carried
     across, so a member rejoining with nothing recorded against them cannot
     blank out the reason from the time before that. */
  const reasonTheyWereRemoved = recorded('removalReason')

  return {
    sheetSourcedWrites: [
      ...refreshed('name', lead.name),
      ...refreshed('company', lead.company),
      ...refreshed('title', lead.jobTitle),
      ...refreshed('phone', lead.phone),
      ...refreshed('city', lead.city),
      ...refreshed('linkedIn', lead.linkedIn),
      ...refreshed('interests', lead.interests),
      ...(reasonTheyWereRemoved === ''
        ? []
        : changing('previousRemovalReason', reasonTheyWereRemoved)),
    ],
    appComposedWrites: [
      /* The reviewer's choice fills a gap and never replaces a recorded value:
         they are reading a LinkedIn profile, the sheet may be recording what the
         person said about themselves, and the default is a guess of `unknown`. */
      ...changing('gender', recorded('gender') === '' ? toGenderCell(gender) : recorded('gender')),
      ...changing('status', ACTIVE_MEMBER_STATUS),
      ...changing('removalReason', ''),
      /* `Approved at` is deliberately absent: it records when this person first
         joined, and a rejoin does not change that. The date of this approval
         goes to `Rejoined at` instead. */
      ...changing('rejoinedAt', approvedAt),
    ],
  }
}
