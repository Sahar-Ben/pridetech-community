import { useEffect, useRef, useState } from 'react'
import { MemberEditSelectField } from './MemberEditSelectField'
import { MemberEditTextField } from './MemberEditTextField'
import { MemberReadOnlyTextField } from './MemberReadOnlyTextField'
import type { Member } from './member'
import {
  hasMailChanged,
  toMemberDraft,
  withDraftStatus,
  type MemberDraft,
  type MemberDraftTextKey,
} from './memberDraft'
import {
  buildRemovalReasonOptions,
  GENDER_OPTIONS,
  STATUS_OPTIONS,
} from './memberEditOptions'
import { useMemberEditSubmit } from './useMemberEditSubmit'

const PLAIN_TEXT_FIELDS: ReadonlyArray<{ key: MemberDraftTextKey; label: string }> = [
  { key: 'title', label: 'Title' },
  { key: 'company', label: 'Company' },
  { key: 'phone', label: 'Phone' },
  { key: 'city', label: 'City' },
  { key: 'linkedIn', label: 'LinkedIn' },
  { key: 'interests', label: 'Interests' },
  { key: 'shirtSize', label: 'Shirt size' },
  { key: 'informedForMembership', label: 'Informed for membership' },
  { key: 'notes', label: 'Notes' },
]

const SAVE_BUTTON_CLASSES =
  'rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60'

const CANCEL_BUTTON_CLASSES =
  'rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

const WARNING_CLASSES = 'text-xs font-medium text-amber-800 dark:text-amber-400'

const SAVE_ERROR_CLASSES =
  'rounded-md border-2 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-200'

type MemberEditFormProps = {
  member: Member
  onSave: (member: Member) => Promise<void>
  onCancel: () => void
}

export const MemberEditForm = ({ member, onSave, onCancel }: MemberEditFormProps) => {
  const [draft, setDraft] = useState<MemberDraft>(() => toMemberDraft(member))
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { fieldErrors, saveErrorMessage, isSaving, submit } = useMemberEditSubmit({
    member,
    draft,
    onSave,
  })

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  const updateDraft = (change: Partial<MemberDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...change }))
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <MemberEditTextField
          errorMessage={fieldErrors.name}
          inputRef={nameInputRef}
          label="Name"
          onChange={(name) => updateDraft({ name })}
          value={draft.name}
        />

        <div>
          <MemberEditTextField
            errorMessage={fieldErrors.mail}
            label="Email"
            onChange={(mail) => updateDraft({ mail })}
            value={draft.mail}
          />
          <div aria-live="polite" role="status">
            {hasMailChanged({ member, draft }) && (
              <p className={WARNING_CLASSES}>
                The email is what matches this person to their event history and applications.
                Changing it re-points those matches.
              </p>
            )}
          </div>
        </div>

        <MemberEditSelectField
          label="Status"
          onChange={(status) => {
            setDraft((currentDraft) => withDraftStatus({ draft: currentDraft, status }))
          }}
          options={STATUS_OPTIONS}
          value={draft.status}
        />

        {draft.status === 'Ex-member' && (
          <MemberEditSelectField
            label="Removal reason"
            onChange={(removalReason) => updateDraft({ removalReason })}
            options={buildRemovalReasonOptions(member.removalReason)}
            value={draft.removalReason}
          />
        )}

        <MemberEditSelectField
          label="Gender"
          onChange={(gender) => updateDraft({ gender })}
          options={GENDER_OPTIONS}
          value={draft.gender}
        />

        {PLAIN_TEXT_FIELDS.map((field) => (
          <MemberEditTextField
            key={field.key}
            label={field.label}
            onChange={(value) => updateDraft({ [field.key]: value })}
            value={draft[field.key]}
          />
        ))}

        <MemberReadOnlyTextField
          explanation="Recorded when the application was decided, so it is not edited here."
          label="Approved at"
          value={member.approvedAt}
        />
      </div>

      <div aria-live="assertive">
        {saveErrorMessage !== undefined && (
          <p className={SAVE_ERROR_CLASSES} role="alert">
            {saveErrorMessage}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className={SAVE_BUTTON_CLASSES} disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button className={CANCEL_BUTTON_CLASSES} onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </form>
  )
}
