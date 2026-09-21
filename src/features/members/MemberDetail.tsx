import { useCallback, useEffect, useRef, useState } from 'react'
import { MemberSavedNotice } from './MemberSavedNotice'
import { MemberDetailFields } from './MemberDetailFields'
import { MemberEditForm } from './MemberEditForm'
import type { Member } from './member'

const BACK_ARROW = '\u{2190}'

const SECONDARY_BUTTON_CLASSES =
  'rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

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
    <article className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2">
        {!isEditing && (
          <button
            className={`${SECONDARY_BUTTON_CLASSES} self-start`}
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true">{BACK_ARROW} </span>
            Back to members
          </button>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3
            className="text-xl font-semibold text-slate-900 outline-none dark:text-slate-100"
            ref={headingRef}
            tabIndex={-1}
          >
            {member.name}
          </h3>
          {!isEditing && (
            <button
              className={SECONDARY_BUTTON_CLASSES}
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

      <section className="rounded-md border border-dashed border-slate-300 px-4 py-3 dark:border-slate-700">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Event history</h4>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Not built yet. Nothing in this app records who attended which event, so there is no
          attendance to show here.
        </p>
      </section>
    </article>
  )
}
