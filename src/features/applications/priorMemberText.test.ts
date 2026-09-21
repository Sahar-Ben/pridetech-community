import { describe, expect, it } from 'vitest'
import type { MemberMatch } from './memberEmailIndex'
import { describePriorMember, describePriorMemberRemoval } from './priorMemberText'

const priorMember = (overrides: Partial<MemberMatch> = {}): MemberMatch => ({
  rowNumber: 57,
  emailKey: 'dana@example.com',
  name: 'Dana Maman',
  status: 'Ex-member',
  removalReason: undefined,
  approvedAt: undefined,
  ...overrides,
})

describe('describePriorMember', () => {
  it('should say the applicant already has a member row, and name it', () => {
    expect(describePriorMember({ priorMember: priorMember() })).toContain('Members row 57')
  })

  it('should say approving brings that row back rather than adding another', () => {
    expect(describePriorMember({ priorMember: priorMember() })).toMatch(/rather than/i)
  })

  it('should carry the status the row is marked with, since it is what took them out', () => {
    expect(describePriorMember({ priorMember: priorMember() })).toContain('Ex-member')
  })

  it('should not invent a status for a row that has none', () => {
    const message = describePriorMember({ priorMember: priorMember({ status: undefined }) })

    expect(message).toContain('Members row 57')
    expect(message).not.toMatch(/marked/i)
  })
})

describe('describePriorMemberRemoval', () => {
  it('should put the reason they were removed in front of the reviewer', () => {
    expect(
      describePriorMemberRemoval({
        priorMember: priorMember({ removalReason: 'Code of conduct' }),
      }),
    ).toContain('Code of conduct')
  })

  it('should say nothing when the row records no reason', () => {
    expect(describePriorMemberRemoval({ priorMember: priorMember() })).toBeUndefined()
  })
})
