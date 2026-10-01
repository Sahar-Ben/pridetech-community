import { memo, useEffect, useRef } from 'react'
import { EmptyValue } from './EmptyValue'
import { MemberStatusBadge } from './MemberStatusBadge'
import { MEMBER_COLUMN_CLASSES } from './memberColumns'
import type { Member } from './member'
import { initialsOf } from '../../app/initials'

const CELL_CLASSES = 'px-3 py-2.5 align-middle text-ink'

const AVATAR_CLASSES = [
  'flex size-[42px] shrink-0 items-center justify-center rounded-[14px] bg-nav-active',
  'font-mono text-[13px] font-bold text-chart-1',
].join(' ')

const GENDER_TAG_CLASSES = [
  'inline-flex size-[30px] items-center justify-center rounded-[9px] border border-card-strong-edge',
  'font-mono text-xs text-neutral-ink',
].join(' ')

/* The rule between rows carries more here than it did on white: 787 of them
   are scanned by eye, and on the deep panel the hairline resolves to a line at
   3.1:1 against its surface where the white theme's was 1.4:1.

   The hover wash is written out rather than taken from `--ui-surface-sunken`,
   which on this panel now means recessed-and-darker: a row lights up under the
   pointer, it does not sink. 1.35:1, against the white theme's 1.09:1. */
const ROW_CLASSES = [
  'cursor-pointer border-t border-hairline first:border-t-0',
  'transition-colors duration-150 ease-brand hover:bg-surface',
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
      <td className={`${CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.name} h-[68px] wrap-anywhere`}>
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className={AVATAR_CLASSES}>
            {initialsOf(member.name)}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <button
              className="rounded text-left text-[15px] font-semibold text-ink underline-offset-2 hover:underline"
              onClick={() => onOpen(member)}
              ref={nameButtonRef}
              type="button"
            >
              {member.name}
            </button>
            {/* The company column is hidden on a phone, so the company rides
                under the name there, as the design has it. */}
            {member.company !== undefined && (
              /* Clamped rather than truncated: `truncate` never wraps, and in
                 the phone's auto-width table a long company would set the
                 width of the whole table. */
              <span aria-hidden="true" className="line-clamp-1 text-xs text-ink-faint sm:hidden">
                {member.company}
              </span>
            )}
          </div>
        </div>
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
        {member.gender === undefined ? (
          <EmptyValue />
        ) : (
          <span className={GENDER_TAG_CLASSES}>{member.gender}</span>
        )}
      </td>
      <td className={`${CELL_CLASSES} ${MEMBER_COLUMN_CLASSES.status} whitespace-nowrap`}>
        <MemberStatusBadge compact status={member.status} />
      </td>
    </tr>
  )
}

/* 787 of these are mounted at once, so a row that re-rendered because something
   elsewhere on the screen changed would multiply that by 787. */
export const MemberRow = memo(MemberRowView)
