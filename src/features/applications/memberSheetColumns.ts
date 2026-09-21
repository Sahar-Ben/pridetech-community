import { MEMBERS_TAB_NAME } from './sheetTabs'
import { buildCellRange } from '../../sheets/a1Range'
import { COLUMN_ALIASES } from '../../sheets/columnAliases'
import { buildHeaderMap, findColumn, type HeaderMap } from '../../sheets/headerMap'
import { readCell } from '../../sheets/readCell'
import type { CellWrite } from '../../sheets/sheetsClient'

/* The label is what the reviewer will go looking for in their own header row, so
   it is the wording their tab actually uses, not the key this code addresses it
   by. The aliases are shared with the read path: one column is one definition,
   or a tab that reads correctly could still be written incorrectly. */
const MEMBER_COLUMNS = {
  name: { label: 'Name', aliases: COLUMN_ALIASES.name },
  company: { label: 'Company', aliases: COLUMN_ALIASES.company },
  title: { label: 'Title', aliases: COLUMN_ALIASES.jobTitle },
  gender: { label: 'Gender', aliases: COLUMN_ALIASES.gender },
  mail: { label: 'Mail', aliases: COLUMN_ALIASES.email },
  phone: { label: 'Phone', aliases: COLUMN_ALIASES.phone },
  city: { label: 'City', aliases: COLUMN_ALIASES.city },
  linkedIn: { label: 'LinkedIn', aliases: COLUMN_ALIASES.linkedIn },
  interests: { label: 'Interests', aliases: COLUMN_ALIASES.interests },
  shirtSize: { label: 'Shirt Size', aliases: COLUMN_ALIASES.shirtSize },
  notes: { label: 'Notes', aliases: COLUMN_ALIASES.notes },
  informedForMembership: {
    label: 'Informed for membership',
    aliases: COLUMN_ALIASES.informedForMembership,
  },
  status: { label: 'Status', aliases: COLUMN_ALIASES.status },
  removalReason: { label: 'Removal reason', aliases: COLUMN_ALIASES.removalReason },
  approvedAt: { label: 'Approved at', aliases: COLUMN_ALIASES.approvedAt },
  previousRemovalReason: {
    label: 'Previous removal reason',
    aliases: COLUMN_ALIASES.previousRemovalReason,
  },
  rejoinedAt: { label: 'Rejoined at', aliases: COLUMN_ALIASES.rejoinedAt },
} as const satisfies Record<string, { label: string; aliases: readonly string[] }>

export type MemberColumnTarget = keyof typeof MEMBER_COLUMNS

export type MemberCellWrite = {
  target: MemberColumnTarget
  value: string
}

type LocatedWrite = {
  columnIndex: number
  value: string
}

const columnOf = ({
  headerMap,
  target,
}: {
  headerMap: HeaderMap
  target: MemberColumnTarget
}): number | undefined => findColumn({ headerMap, aliases: MEMBER_COLUMNS[target].aliases })

/* Every requested column is resolved before a single value is placed, and a
   column that resolves to nothing stops the whole row. Skipping the missing one
   instead would append a member with no email address, or with a blank LinkedIn
   nobody would think to look for, and say nothing about either. */
const locateWrites = ({
  membersHeaderRow,
  writes,
}: {
  membersHeaderRow: readonly string[]
  writes: readonly MemberCellWrite[]
}): readonly LocatedWrite[] => {
  const headerMap = buildHeaderMap(membersHeaderRow)
  const located = writes.map((write) => ({
    write,
    columnIndex: columnOf({ headerMap, target: write.target }),
  }))
  const missingLabels = located
    .filter(({ columnIndex }) => columnIndex === undefined)
    .map(({ write }) => MEMBER_COLUMNS[write.target].label)

  if (missingLabels.length > 0) {
    throw new Error(
      `The Members tab has no column headed ${missingLabels.join(' or ')} \u{2014} nothing was written. Restore the heading in the sheet, then reload.`,
    )
  }

  return located.flatMap(({ write, columnIndex }) =>
    columnIndex === undefined ? [] : [{ columnIndex, value: write.value }],
  )
}

/* Asking whether a column is there, separately from writing to it, so a caller
   that cannot do its job without one can say which and why. `locateWrites`
   refuses the same columns, but only once it is already composing a write, and
   its message can only say that a heading was absent. */
export const findMissingMemberColumns = ({
  membersHeaderRow,
  targets,
}: {
  membersHeaderRow: readonly string[]
  targets: readonly MemberColumnTarget[]
}): readonly string[] => {
  const headerMap = buildHeaderMap(membersHeaderRow)
  return targets.flatMap((target) =>
    columnOf({ headerMap, target }) === undefined ? [MEMBER_COLUMNS[target].label] : [],
  )
}

export type MemberColumnIndexes = Partial<Record<MemberColumnTarget, number>>

const MEMBER_COLUMN_TARGETS: readonly MemberColumnTarget[] = Object.keys(MEMBER_COLUMNS).filter(
  (key): key is MemberColumnTarget => key in MEMBER_COLUMNS,
)

/* Every column resolved once for a whole tab, which `readMemberCell` cannot do:
   it rebuilds the header map per cell, and the Members tab is 787 rows of
   sixteen columns. The aliases are the same ones the writes resolve through, so
   a tab that reads correctly still writes to the column it was read from. */
export const locateMemberColumns = ({
  membersHeaderRow,
}: {
  membersHeaderRow: readonly string[]
}): MemberColumnIndexes => {
  const headerMap = buildHeaderMap(membersHeaderRow)
  return MEMBER_COLUMN_TARGETS.reduce<MemberColumnIndexes>((located, target) => {
    const columnIndex = columnOf({ headerMap, target })
    if (columnIndex === undefined) {
      return located
    }
    return { ...located, [target]: columnIndex }
  }, {})
}

export const readMemberCell = ({
  membersHeaderRow,
  row,
  target,
}: {
  membersHeaderRow: readonly string[]
  row: readonly string[]
  target: MemberColumnTarget
}): string | undefined =>
  readCell({ row, column: columnOf({ headerMap: buildHeaderMap(membersHeaderRow), target }) })

/* Only the cells named here are addressed, each as its own single-cell range.
   A span would carry the cells between them along with it, and every cell this
   app sends back was read out of the sheet as its displayed text: a formula
   would return as its own result and a date as whatever the reading locale made
   of it. The cells nobody asked to change are safe because nothing writes them. */
export const buildMemberCellWrites = ({
  membersHeaderRow,
  rowNumber,
  writes,
}: {
  membersHeaderRow: readonly string[]
  rowNumber: number
  writes: readonly MemberCellWrite[]
}): readonly CellWrite[] =>
  locateWrites({ membersHeaderRow, writes }).map(({ columnIndex, value }) => ({
    range: buildCellRange({ tabName: MEMBERS_TAB_NAME, columnIndex, rowNumber }),
    value,
  }))

/* Appending is the one write that has to compose a whole row, because the row
   does not exist yet and there is nothing in it to preserve. */
export const buildMemberSheetRow = ({
  membersHeaderRow,
  writes,
}: {
  membersHeaderRow: readonly string[]
  writes: readonly MemberCellWrite[]
}): string[] => {
  const located = locateWrites({ membersHeaderRow, writes })
  const valueByColumn = new Map(located.map(({ columnIndex, value }) => [columnIndex, value]))
  const width = Math.max(
    membersHeaderRow.length,
    ...located.map(({ columnIndex }) => columnIndex + 1),
  )

  return Array.from({ length: width }, (_cell, columnIndex) => valueByColumn.get(columnIndex) ?? '')
}
