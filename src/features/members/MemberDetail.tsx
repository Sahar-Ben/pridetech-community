import { useCallback, useEffect, useRef, useState } from 'react'
import { MemberSavedNotice } from './MemberSavedNotice'
import { MemberDetailFields } from './MemberDetailFields'
import { MemberEditForm } from './MemberEditForm'
import type { Member } from './member'
import {
  COMPACT_BUTTON_SIZE_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from '../../theme/controls'
import { DATA_PANEL_CLASSES, RECORD_TITLE_CLASSES } from '../../theme/surfaces'

const BACK_ARROW = '\u{2190}'

const ACTION_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const DETAIL_CLASSES = `${DATA_PANEL_CLASSES} animate-rise flex flex-col gap-4 px-4 py-4 sm:px-6`

type MemberDetailProps = {
  member: Member
  onClose: () => void
  onSave: (member: Member) => Promise<void>
}

export const MemberDetail = ({ member, onClose, onSave }: MemberDetailProps) => {
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
  const saveEdit = async (updatedMember: Member): Promise<void> => {
    await onSave(updatedMember)
    setWasSaved(true)
    leaveEditMode()
  }

  return (
    <article className={DETAIL_CLASSES}>
      <div className="flex flex-col gap-2">
        {!isEditing && (
          <button
            className={`${ACTION_BUTTON_CLASSES} self-start`}
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true">{BACK_ARROW} </span>
            Back to members
          </button>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3
            className={`${RECORD_TITLE_CLASSES} outline-none`}
            ref={headingRef}
            tabIndex={-1}
          >
            {member.name}
          </h3>
          {!isEditing && (
            <button
              className={ACTION_BUTTON_CLASSES}
              onClick={() => setIsEditing(true)}
              ref={editButtonRef}
              type="button"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div aria-live="polite" role="status">
        {wasSaved && !isEditing && <MemberSavedNotice />}
      </div>

      {isEditing ? (
        <MemberEditForm member={member} onCancel={leaveEditMode} onSave={saveEdit} />
      ) : (
        <MemberDetailFields member={member} />
      )}

      <section className="rounded-xl border border-dashed border-edge px-4 py-3">
        <h4 className="text-sm font-bold text-ink">Event history</h4>
        <p className="mt-1 text-sm text-ink-muted">
          Not built yet. Nothing in this app records who attended which event, so there is no
          attendance to show here.
        </p>
      </section>
    </article>
  )
}
