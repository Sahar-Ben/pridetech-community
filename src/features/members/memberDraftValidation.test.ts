import { describe, expect, it } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { toMemberDraft } from './memberDraft'
import { hasDraftErrors, validateMemberDraft } from './memberDraftValidation'

const draftOf = (overrides: Partial<ReturnType<typeof toMemberDraft>> = {}) => ({
  ...toMemberDraft(buildMember({ name: 'Dana Sorkin', mail: 'dana@example.com' })),
  ...overrides,
})

describe('validateMemberDraft', () => {
  it('should accept a filled-in member', () => {
    expect(validateMemberDraft(draftOf())).toEqual({})
  })

  it('should refuse a member with no name', () => {
    expect(validateMemberDraft(draftOf({ name: '   ' })).name).toMatch(/name/i)
  })

  it('should refuse a member with no email', () => {
    expect(validateMemberDraft(draftOf({ mail: '' })).mail).toMatch(/email/i)
  })

  it('should refuse an address that is not shaped like an email', () => {
    expect(validateMemberDraft(draftOf({ mail: 'dana at example' })).mail).toMatch(/email/i)
  })

  it('should accept the scruffy values a hand-kept sheet holds', () => {
    expect(
      validateMemberDraft(
        draftOf({
          phone: 'call via Noa',
          linkedIn: 'not on linkedin',
          shirtSize: 'M/L?',
          informedForMembership: 'asked twice, no answer',
        }),
      ),
    ).toEqual({})
  })
})

describe('hasDraftErrors', () => {
  it('should let a draft with nothing wrong through', () => {
    expect(hasDraftErrors(validateMemberDraft(draftOf()))).toBe(false)
  })

  it('should hold back a draft with a bad field', () => {
    expect(hasDraftErrors(validateMemberDraft(draftOf({ mail: '' })))).toBe(true)
  })
})
