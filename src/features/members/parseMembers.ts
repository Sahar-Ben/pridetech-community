import type { Member, MemberGender } from './member'
import { toMemberStatus } from './memberStatus'
import { sortMembersByName } from './sortMembersByName'
import {
  findMissingMemberColumns,
  locateMemberColumns,
  type MemberColumnIndexes,
  type MemberColumnTarget,
} from '../applications/memberSheetColumns'
import { MEMBERS_TAB_NAME } from '../applications/sheetTabs'
import { hasAnyRecordedCell, readCell } from '../../sheets/readCell'

const HEADER_ROW_COUNT = 1

/* The two columns the directory cannot be built without: one of them is how a
   person is found by eye and the other is how they are matched to their
   applications. Everything else is allowed to be missing, because the tab grew
   its columns by hand over years and half of them are blank even where they
   exist. */
const REQUIRED_COLUMNS: readonly MemberColumnTarget[] = ['name', 'mail']

const RECORDED_GENDERS: readonly MemberGender[] = ['F', 'M']

/* Gender is typed by hand at approval, so it is read case-insensitively; a cell
   holding anything else reads as unrecorded rather than as a third gender,
   which is what the split already reports on its own. */
const toGender = (cell: string | undefined): MemberGender | undefined =>
  RECORDED_GENDERS.find((gender) => gender === cell?.toUpperCase())

const toMember = ({
  row,
  columns,
  rowNumber,
}: {
  row: readonly string[]
  columns: MemberColumnIndexes
  rowNumber: number
}): Member => {
  const cell = (target: MemberColumnTarget): string | undefined =>
    readCell({ row, column: columns[target] })

  return {
    rowNumber,
    name: cell('name') ?? '',
    mail: cell('mail') ?? '',
    company: cell('company'),
    title: cell('title'),
    gender: toGender(cell('gender')),
    informedForMembership: cell('informedForMembership'),
    phone: cell('phone'),
    city: cell('city'),
    linkedIn: cell('linkedIn'),
    interests: cell('interests'),
    shirtSize: cell('shirtSize'),
    notes: cell('notes'),
    status: toMemberStatus(cell('status')),
    removalReason: cell('removalReason'),
    approvedAt: cell('approvedAt'),
  }
}

const requireHeaderRow = (rows: readonly (readonly string[])[]): readonly string[] => {
  const [headerRow] = rows
  if (headerRow === undefined) {
    throw new Error(
      `The ${MEMBERS_TAB_NAME} tab came back empty \u{2014} it has no header row to read.`,
    )
  }
  const missingLabels = findMissingMemberColumns({
    membersHeaderRow: headerRow,
    targets: REQUIRED_COLUMNS,
  })
  if (missingLabels.length > 0) {
    throw new Error(
      `The ${MEMBERS_TAB_NAME} tab has no column headed ${missingLabels.join(' or ')} \u{2014} restore the heading in the sheet, then reload.`,
    )
  }
  return headerRow
}

/* Alphabetical rather than sheet order, because 787 people are scanned by eye
   and nobody knows what row somebody is on. The order is settled here, once per
   read, so no screen re-sorts the directory while somebody is typing in it. */
export const parseMembers = ({
  rows,
}: {
  rows: readonly (readonly string[])[]
}): readonly Member[] => {
  const headerRow = requireHeaderRow(rows)
  const columns = locateMemberColumns({ membersHeaderRow: headerRow })

  const members = rows.slice(HEADER_ROW_COUNT).flatMap((row, index) => {
    if (!hasAnyRecordedCell(row)) {
      return []
    }
    return [toMember({ row, columns, rowNumber: index + HEADER_ROW_COUNT + 1 })]
  })

  return sortMembersByName(members)
}
