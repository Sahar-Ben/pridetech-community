import { useEffect, useRef } from 'react'
import { EmptyValue } from './EmptyValue'
import { MemberStatusBadge } from './MemberStatusBadge'
import { MEMBER_COLUMN_CLASSES } from './memberColumns'
import type { Member } from './member'

const CELL_CLASSES = 'px-2 py-2 align-middle text-slate-700 dark:text-slate-300'

/* The secondary columns are scan targets, not the record: the detail view
   carries the value in full, so one clipped line keeps the rows even. */
const SECONDARY_CELL_CLASSES = `${CELL_CLASSES} truncate`

type MemberRowProps = {
  member: Member
  isFocusRequested: boolean
  onOpen: (member: Member) => void
  onFocusRestored: () => void
}

export const MemberRow = ({
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
      className="cursor-pointer border-t border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800/60"
      onClick={() => onOpen(member)}
    >
      <td className={`${CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.name} font-medium break-words`}>
        <button
          className="rounded text-left text-slate-900 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-slate-100"
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
