import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CopyAllButton } from './CopyAllButton'
import { MemberSavedNotice } from './MemberSavedNotice'
import { buildMemberContactSummary } from './memberContactSummary'
import { MemberStatusBadge } from './MemberStatusBadge'
import { MemberDetailFields } from './MemberDetailFields'
import { MemberEditForm } from './MemberEditForm'
import { toRecordedMail, type Member } from './member'
import { initialsOf } from '../../app/initials'
import { QuickActions } from '../../app/QuickActions'
import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'
import { RECORD_TITLE_CLASSES, WORK_PANEL_CLASSES } from '../../theme/surfaces'

const BACK_ARROW = '\u{2190}'

const ACTION_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const DETAIL_CLASSES = `${WORK_PANEL_CLASSES} animate-rise flex flex-col gap-5 rounded-[var(--radius-brand)] px-4 py-4 sm:px-6`

const AVATAR_CLASSES = [
  'flex size-16 shrink-0 items-center justify-center rounded-[20px] border border-card-strong-edge',
  'bg-nav-active font-mono text-lg font-bold text-chart-1',
].join(' ')

type MemberDetailProps = {
  member: Member
  onClose: () => void
  onSave: (member: Member) => Promise<void>
  eventHistory: ReactNode
}

export const MemberDetail = ({ member, onClose, onSave, eventHistory }: MemberDetailProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const isEditButtonFocusRequested = useRef(false)
  const [isEditing, setIsEditing] = useState(false)
  const [wasSaved, setWasSaved] = useState(false)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const leaveEditMode = useCallback(() => {
    isEditButtonFocusRequested.current = true
    setIsEditing(false)
  }, [])

  useEffect(() => {
    if (isEditing || !isEditButtonFocusRequested.current) {
      return
    }
    isEditButtonFocusRequested.current = false
    editButtonRef.current?.focus()
  }, [isEditing])

  /* While editing, Escape gives the edit back rather than throwing the detail
     away with the unsaved changes still in it. */
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }
      if (isEditing) {
        leaveEditMode()
        return
      }
      onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isEditing, leaveEditMode, onClose])

  /* Nothing is recorded here until the sheet has taken it: a rejection is left
     to travel back to the form, which stays open with the reason on it. */
  const role = [member.title, member.company].filter((part) => part !== undefined).join(' · ')

  const saveEdit = async (updatedMember: Member): Promise<void> => {
    await onSave(updatedMember)
    setWasSaved(true)
    leaveEditMode()
  }

  return (
    <article className={DETAIL_CLASSES}>
      <div className="flex flex-col gap-2">
        {!isEditing && (
          <button className={`${ACTION_BUTTON_CLASSES} self-start`} onClick={onClose} type="button">
            <span aria-hidden="true">{BACK_ARROW} </span>
            Back to members
          </button>
        )}
        <div className="flex items-start gap-4 pt-2">
          <span aria-hidden="true" className={AVATAR_CLASSES}>
            {initialsOf(member.name)}
          </span>
          <div className="flex min-w-0 grow flex-col gap-1">
            <h3
              className={`${RECORD_TITLE_CLASSES} text-[26px] leading-tight wrap-anywhere outline-none`}
              ref={headingRef}
              tabIndex={-1}
            >
              {member.name}
            </h3>
            {role !== '' && <p className="text-sm text-ink-muted">{role}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <MemberStatusBadge status={member.status} />
              {member.city !== undefined && (
                <span className="rounded-full border border-card-strong-edge px-2.5 py-0.5 text-xs text-neutral-ink">
                  {member.city}
                </span>
              )}
            </div>
          </div>
          {!isEditing && (
            <button
              className={`${ACTION_BUTTON_CLASSES} min-h-11 shrink-0`}
              onClick={() => setIsEditing(true)}
              ref={editButtonRef}
              type="button"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="flex flex-col gap-2">
          <QuickActions
            actions={['linkedin', 'whatsapp', 'call', 'email']}
            email={toRecordedMail(member)}
            linkedIn={member.linkedIn}
            phone={member.phone}
          />
          <CopyAllButton text={buildMemberContactSummary(member)} />
        </div>
      )}

      <div aria-live="polite" role="status">
        {wasSaved && !isEditing && <MemberSavedNotice />}
      </div>

      {isEditing ? (
        <MemberEditForm member={member} onCancel={leaveEditMode} onSave={saveEdit} />
      ) : (
        <MemberDetailFields member={member} />
      )}

      {eventHistory}
    </article>
  )
}
