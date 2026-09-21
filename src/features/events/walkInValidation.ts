const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type WalkInFields = {
  name: string
  email: string
}

export type WalkInErrors = Partial<Record<keyof WalkInFields, string>>

const findNameError = (name: string): string | undefined =>
  name.trim() === '' ? 'A walk-in needs a name.' : undefined

/* Blank is allowed: people at a door decline to give an email, and refusing to
   record them at all would lose the one fact worth having, that they came. */
const findEmailError = (email: string): string | undefined => {
  const trimmed = email.trim()
  if (trimmed === '' || EMAIL_SHAPE.test(trimmed)) {
    return undefined
  }
  return 'This does not look like an email address.'
}

export const validateWalkInDraft = (fields: WalkInFields): WalkInErrors => {
  const name = findNameError(fields.name)
  const email = findEmailError(fields.email)

  return {
    ...(name !== undefined && { name }),
    ...(email !== undefined && { email }),
  }
}

export const hasWalkInErrors = (errors: WalkInErrors): boolean => Object.keys(errors).length > 0
