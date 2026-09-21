import { describe, expect, it } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { toMemberDraft, type MemberDraft } from './memberDraft'
import { hasDraftErrors, validateMemberDraft } from './memberDraftValidation'
import type { Member } from './member'

const dana = buildMember({ name: 'Dana Sorkin', mail: 'dana@example.com' })

const validate = ({
  overrides = {},
  member = dana,
}: {
  overrides?: Partial<MemberDraft>
  member?: Member
} = {}) => validateMemberDraft({ member, draft: { ...toMemberDraft(member), ...overrides } })

describe('validateMemberDraft', () => {
  it('should accept a filled-in member', () => {
    expect(validate()).toEqual({})
  })

  it('should refuse to empty a name the sheet already holds', () => {
    expect(validate({ overrides: { name: '   ' } }).name).toMatch(/name/i)
  })

  it('should refuse to empty an address the sheet already holds', () => {
    expect(validate({ overrides: { mail: '' } }).mail).toMatch(/email/i)
  })

  it('should refuse an address that is not shaped like an email', () => {
    expect(validate({ overrides: { mail: 'dana at example' } }).mail).toMatch(/email/i)
  })

  it('should let a member the sheet never gave a name be saved', () => {
    const nameless = buildMember({ name: '', mail: 'unknown@example.com' })

    expect(validate({ member: nameless, overrides: { city: 'Haifa' } })).toEqual({})
  })

  it('should let a member the sheet never gave an address be saved', () => {
    const mailless = buildMember({ name: 'Roni Halperin', mail: '' })

    expect(validate({ member: mailless, overrides: { city: 'Haifa' } })).toEqual({})
  })

  it('should still check the shape of an address added to a member who had none', () => {
    const mailless = buildMember({ name: 'Roni Halperin', mail: '' })

    expect(validate({ member: mailless, overrides: { mail: 'roni at example' } }).mail).toMatch(
      /email/i,
    )
  })

  it('should accept the scruffy values a hand-kept sheet holds', () => {
    expect(
      validate({
        overrides: {
          phone: 'call via Noa',
          linkedIn: 'not on linkedin',
          shirtSize: 'M/L?',
          informedForMembership: 'asked twice, no answer',
        },
      }),
    ).toEqual({})
  })
})

describe('hasDraftErrors', () => {
  it('should let a draft with nothing wrong through', () => {
    expect(hasDraftErrors(validate())).toBe(false)
  })

  it('should hold back a draft with a bad field', () => {
    expect(hasDraftErrors(validate({ overrides: { mail: '' } }))).toBe(true)
  })
})
