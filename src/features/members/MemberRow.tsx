import { memo, useEffect, useRef } from 'react'
import { EmptyValue } from './EmptyValue'
import { MemberStatusBadge } from './MemberStatusBadge'
import { MEMBER_COLUMN_CLASSES } from './memberColumns'
import type { Member } from './member'

const CELL_CLASSES = 'px-3 py-2.5 align-middle text-ink'

/* The rule between rows carries more here than it did on white: 787 of them
   are scanned by eye, and on the deep panel the hairline resolves to a line at
   3.1:1 against its surface where the white theme's was 1.4:1.

   The hover wash is written out rather than taken from `--ui-surface-sunken`,
   which on this panel now means recessed-and-darker: a row lights up under the
   pointer, it does not sink. 1.35:1, against the white theme's 1.09:1. */
const ROW_CLASSES = [
  'cursor-pointer border-t border-hairline',
  'transition-colors duration-150 ease-brand hover:bg-on-brand/10',
].join(' ')

/* The secondary columns are scan targets, not the record: the detail view
   carries the value in full, so one clipped line keeps the rows even. */
const SECONDARY_CELL_CLASSES = `${CELL_CLASSES} truncate`

type MemberRowProps = {
  member: Member
  isFocusRequested: boolean
  onOpen: (member: Member) => void
  onFocusRestored: () => void
}

const MemberRowView = ({
  member,
  isFocusRequested,
  onOpen,
  onFocusRestored,
}: MemberRowProps) => {
  const nameButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isFocusRequested) {
      return
    }
    nameButtonRef.current?.focus()
    onFocusRestored()
  }, [isFocusRequested, onFocusRestored])

  return (
    <tr
      className={ROW_CLASSES}
      onClick={() => onOpen(member)}
    >
      <td className={`${CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.name} font-medium break-words`}>
        <button
          className="rounded text-left font-semibold text-ink underline-offset-2 hover:underline"
          onClick={() => onOpen(member)}
          ref={nameButtonRef}
          type="button"
        >
          {member.name}
        </button>
      </td>
      <td className={`${SECONDARY_CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.title}`}>
        {member.title ?? <EmptyValue />}
      </td>
      <td className={`${SECONDARY_CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.company}`}>
        {member.company ?? <EmptyValue />}
      </td>
      <td className={`${SECONDARY_CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.city}`}>
        {member.city ?? <EmptyValue />}
      </td>
      <td className={`${CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.gender} whitespace-nowrap`}>
        {member.gender ?? <EmptyValue />}
      </td>
      <td className={`${CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.status} whitespace-nowrap`}>
        <MemberStatusBadge status={member.status} />
      </td>
    </tr>
  )
}

/* 787 of these are mounted at once, so a row that re-rendered because something
   elsewhere on the screen changed would multiply that by 787. */
export const MemberRow = memo(MemberRowView)
