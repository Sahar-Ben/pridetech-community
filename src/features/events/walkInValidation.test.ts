import { describe, expect, it } from 'vitest'
import { hasWalkInErrors, validateWalkInDraft } from './walkInValidation'

describe('validateWalkInDraft', () => {
  it('should accept a name and an email', () => {
    const errors = validateWalkInDraft({ name: 'Shai Lavon', email: 'shai.lavon@example.com' })

    expect(hasWalkInErrors(errors)).toBe(false)
  })

  it('should refuse a walk-in with no name, since nothing else identifies them', () => {
    const errors = validateWalkInDraft({ name: '   ', email: 'shai.lavon@example.com' })

    expect(errors.name).toMatch(/name/i)
  })

  it('should accept a walk-in who did not give an email at the door', () => {
    const errors = validateWalkInDraft({ name: 'Shai Lavon', email: '' })

    expect(hasWalkInErrors(errors)).toBe(false)
  })

  it('should refuse something that is not an email rather than storing it as one', () => {
    const errors = validateWalkInDraft({ name: 'Shai Lavon', email: 'shai at example' })

    expect(errors.email).toMatch(/email/i)
  })
})
