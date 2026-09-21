import { memo } from 'react'
import { MemberRow } from './MemberRow'
import { MEMBER_COLUMN_CLASSES } from './memberColumns'
import type { Member } from './member'

const HEADER_CELL_CLASSES =
  'px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400'

/* No `overflow` on the wrapper: any scroll container here, hidden or auto,
   would become the sticky header's scrollport and the header would stop
   following the page. Narrow viewports drop columns instead of scrolling. */
const WRAPPER_CLASSES =
  'rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'

type MembersTableProps = {
  members: readonly Member[]
  rowNumberToFocus: number | undefined
  onOpenMember: (member: Member) => void
  onFocusRestored: () => void
}

const MembersTableView = ({
  members,
  rowNumberToFocus,
  onOpenMember,
  onFocusRestored,
}: MembersTableProps) => (
  <div className={WRAPPER_CLASSES}>
    <table aria-label="Members" className="w-full table-fixed text-sm">
      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
        <tr>
          <th
            className={`${HEADER_CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.name} rounded-tl-lg`}
            scope="col"
          >
            Name
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.title}`} scope="col">
            Title
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.company}`} scope="col">
            Company
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.city}`} scope="col">
            City
          </th>
          <th className={`${HEADER_CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.gender}`} scope="col">
            Gender
          </th>
          <th
            className={`${HEADER_CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.status} rounded-tr-lg`}
            scope="col"
          >
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <MemberRow
            isFocusRequested={member.rowNumber === rowNumberToFocus}
            key={member.rowNumber}
            member={member}
            onFocusRestored={onFocusRestored}
            onOpen={onOpenMember}
          />
        ))}
      </tbody>
    </table>
  </div>
)

/* The whole table is skipped, not only its rows: a keystroke in the search box
   re-renders the directory around it, and reconciling 787 unchanged rows is the
   work that made typing lag. The debounce decides when this list changes; this
   is what makes every render in between free. */
export const MembersTable = memo(MembersTableView)
