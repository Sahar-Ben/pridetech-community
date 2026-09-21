import { memo } from 'react'
import { MemberRow } from './MemberRow'
import { MEMBER_COLUMN_CLASSES } from './memberColumns'
import type { Member } from './member'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

const HEADER_CELL_CLASSES =
  'px-3 py-2.5 text-left text-xs font-bold tracking-wide text-ink-muted uppercase'

/* The one opaque thing on the panel, and it has to be: rows scroll underneath a
   sticky header, and a translucent one would show them through the column
   names. `--ui-panel-deep-solid` is the panel's own lightest composite written
   out flat, which is also the surface every contrast here was measured on. */
const HEADER_ROW_CLASSES = 'sticky top-0 bg-panel-deep-solid'

/* No `overflow` on the wrapper: any scroll container here, hidden or auto,
   would become the sticky header's scrollport and the header would stop
   following the page. Narrow viewports drop columns instead of scrolling. */
const WRAPPER_CLASSES = WORK_PANEL_CLASSES

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
      <thead className={HEADER_ROW_CLASSES}>
        <tr>
          <th
            className={`${HEADER_CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.name} rounded-tl-[var(--radius-data)]`}
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
            className={`${HEADER_CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.status} rounded-tr-[var(--radius-data)]`}
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
