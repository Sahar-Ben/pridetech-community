import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MemberEditSelectField } from './MemberEditSelectField'
import { MemberEditTextField } from './MemberEditTextField'
import { MemberReadOnlyTextField } from './MemberReadOnlyTextField'
import type { Member } from './member'
import {
  applyDraftToMember,
  hasMailChanged,
  toMemberDraft,
  withDraftStatus,
  type MemberDraft,
  type MemberDraftTextKey,
} from './memberDraft'
import {
  hasDraftErrors,
  validateMemberDraft,
  type MemberDraftErrors,
} from './memberDraftValidation'
import { GENDER_OPTIONS, REMOVAL_REASON_OPTIONS, STATUS_OPTIONS } from './memberEditOptions'

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
  'rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700'

const CANCEL_BUTTON_CLASSES =
  'rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

const WARNING_CLASSES = 'text-xs font-medium text-amber-800 dark:text-amber-400'

type MemberEditFormProps = {
  member: Member
  onSave: (member: Member) => void
  onCancel: () => void
}

export const MemberEditForm = ({ member, onSave, onCancel }: MemberEditFormProps) => {
  const [draft, setDraft] = useState<MemberDraft>(() => toMemberDraft(member))
  const [errors, setErrors] = useState<MemberDraftErrors>({})
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  const updateDraft = (change: Partial<MemberDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...change }))
  }

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const foundErrors = validateMemberDraft(draft)
    setErrors(foundErrors)
    if (hasDraftErrors(foundErrors)) {
      return
    }
    onSave(applyDraftToMember({ member, draft }))
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submitEdit}>
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <MemberEditTextField
          errorMessage={errors.name}
          inputRef={nameInputRef}
          label="Name"
          onChange={(name) => updateDraft({ name })}
          value={draft.name}
        />

        <div>
          <MemberEditTextField
            errorMessage={errors.mail}
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
            options={REMOVAL_REASON_OPTIONS}
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

      <div className="flex flex-wrap items-center gap-3">
        <button className={SAVE_BUTTON_CLASSES} type="submit">
          Save
        </button>
        <button className={CANCEL_BUTTON_CLASSES} onClick={onCancel} type="button">
          Cancel
        </button>
        <p className={WARNING_CLASSES}>
          Saving keeps the change in this browser only. Nothing here reaches the Google Sheet yet.
        </p>
      </div>
    </form>
  )
}
