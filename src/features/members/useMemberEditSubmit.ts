import { useRef, useState, type FormEvent } from 'react'
import type { Member } from './member'
import { applyDraftToMember, type MemberDraft } from './memberDraft'
import {
  hasDraftErrors,
  validateMemberDraft,
  type MemberDraftErrors,
} from './memberDraftValidation'
import { describeError } from '../../errors/describeError'

const SAVE_FAILED_MESSAGE = 'The change was not saved and the sheet was not changed.'

export type MemberEditSubmission = {
  fieldErrors: MemberDraftErrors
  saveErrorMessage: string | undefined
  isSaving: boolean
  submit: (event: FormEvent<HTMLFormElement>) => void
}

/* A save that fails leaves the form exactly as the organiser left it, with the
   reason on it. Closing the form on a rejected write is the one outcome that
   cannot be recovered from the screen: the edit is gone, the sheet is
   unchanged, and nothing says so. */
export const useMemberEditSubmit = ({
  member,
  draft,
  onSave,
}: {
  member: Member
  draft: MemberDraft
  onSave: (member: Member) => Promise<void>
}): MemberEditSubmission => {
  const [fieldErrors, setFieldErrors] = useState<MemberDraftErrors>({})
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)

  /* A ref, not the saving state: two clicks in the same tick both read the same
     render's state, and the second one would start a second write. */
  const isSaveInFlight = useRef(false)

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const foundErrors = validateMemberDraft({ draft, member })
    setFieldErrors(foundErrors)
    if (hasDraftErrors(foundErrors) || isSaveInFlight.current) {
      return
    }

    isSaveInFlight.current = true
    setSaveErrorMessage(undefined)
    setIsSaving(true)

    onSave(applyDraftToMember({ member, draft }))
      .catch((error: unknown) => {
        setSaveErrorMessage(describeError({ error, fallback: SAVE_FAILED_MESSAGE }))
      })
      .finally(() => {
        isSaveInFlight.current = false
        setIsSaving(false)
      })
  }

  return { fieldErrors, saveErrorMessage, isSaving, submit }
}
