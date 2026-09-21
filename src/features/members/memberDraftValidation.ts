import type { MemberDraft } from './memberDraft'

/* Deliberately lax: the sheet is kept by hand, and a validator that rejects a
   real address costs more than one that lets a scruffy one through. */
const MAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type MemberDraftErrors = Partial<Record<'name' | 'mail', string>>

const findNameError = (name: string): string | undefined =>
  name.trim() === '' ? 'A member needs a name.' : undefined

const findMailError = (mail: string): string | undefined => {
  const trimmed = mail.trim()
  if (trimmed === '') {
    return 'An email is needed: it is what matches this person to their event history and applications.'
  }
  if (!MAIL_SHAPE.test(trimmed)) {
    return 'This does not look like an email address.'
  }
  return undefined
}

export const validateMemberDraft = (draft: MemberDraft): MemberDraftErrors => {
  const name = findNameError(draft.name)
  const mail = findMailError(draft.mail)

  return {
    ...(name !== undefined && { name }),
    ...(mail !== undefined && { mail }),
  }
}

export const hasDraftErrors = (errors: MemberDraftErrors): boolean =>
  Object.keys(errors).length > 0
