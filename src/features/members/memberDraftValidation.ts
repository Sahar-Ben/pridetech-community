import { hasRecordedMail, type Member } from './member'
import type { MemberDraft } from './memberDraft'

/* Deliberately lax: the sheet is kept by hand, and a validator that rejects a
   real address costs more than one that lets a scruffy one through. */
const MAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type MemberDraftErrors = Partial<Record<'name' | 'mail', string>>

/* Emptying a recorded field is refused; a field that was already empty is not.
   The Members tab holds rows with no name and rows with no address, and an
   organiser fixing the phone number on one of them must not be told to invent
   the missing field before the sheet will take the fix. */
const findNameError = ({ draft, member }: { draft: MemberDraft; member: Member }) => {
  if (draft.name.trim() !== '' || member.name === '') {
    return undefined
  }
  return 'A member needs a name.'
}

const findMailError = ({ draft, member }: { draft: MemberDraft; member: Member }) => {
  const trimmed = draft.mail.trim()
  if (trimmed === '') {
    return hasRecordedMail(member)
      ? 'An email is needed: it is what matches this person to their event history and applications.'
      : undefined
  }
  return MAIL_SHAPE.test(trimmed) ? undefined : 'This does not look like an email address.'
}

export const validateMemberDraft = ({
  draft,
  member,
}: {
  draft: MemberDraft
  member: Member
}): MemberDraftErrors => {
  const name = findNameError({ draft, member })
  const mail = findMailError({ draft, member })

  return {
    ...(name !== undefined && { name }),
    ...(mail !== undefined && { mail }),
  }
}

export const hasDraftErrors = (errors: MemberDraftErrors): boolean =>
  Object.keys(errors).length > 0
