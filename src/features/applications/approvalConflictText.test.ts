import { describe, expect, it } from 'vitest'
import {
  describeAddressTakenByAnotherMember,
  describeAlreadyDecided,
  describeDuplicateMemberRows,
  listMemberRowNumbers,
} from './approvalConflictText'
import type { MemberMatch } from './memberEmailIndex'

const member = (overrides: Partial<MemberMatch> = {}): MemberMatch => ({
  rowNumber: 2,
  emailKey: 'dana@example.com',
  name: 'Dana Maman',
  status: 'Active',
  removalReason: undefined,
  approvedAt: '2024-01-01',
  ...overrides,
})

describe('listMemberRowNumbers', () => {
  it('should name a single row on its own', () => {
    expect(listMemberRowNumbers([member({ rowNumber: 7 })])).toBe('row 7')
  })

  it('should join two rows with and, so the sentence reads as one', () => {
    expect(listMemberRowNumbers([member({ rowNumber: 2 }), member({ rowNumber: 3 })])).toBe(
      'rows 2 and 3',
    )
  })

  it('should comma-separate all but the last of three rows', () => {
    expect(
      listMemberRowNumbers([
        member({ rowNumber: 2 }),
        member({ rowNumber: 9 }),
        member({ rowNumber: 14 }),
      ]),
    ).toBe('rows 2, 9 and 14')
  })

  it('should refuse to describe no rows at all rather than produce an empty sentence', () => {
    expect(() => listMemberRowNumbers([])).toThrow(/at least one row/i)
  })
})

describe('describeDuplicateMemberRows', () => {
  const message = describeDuplicateMemberRows({
    emailKey: 'dana@example.com',
    matches: [member({ rowNumber: 2 }), member({ rowNumber: 3 })],
  })

  it('should name every row the reviewer has to merge', () => {
    expect(message).toContain('rows 2 and 3')
  })

  it('should say the sheet was left alone', () => {
    expect(message).toMatch(/nothing was written/i)
  })

  it('should tell the reviewer the fix is in the sheet, since the app cannot make it', () => {
    expect(message).toMatch(/merge or correct those rows in the sheet/i)
  })
})

describe('describeAddressTakenByAnotherMember', () => {
  const message = describeAddressTakenByAnotherMember({
    member: member({ rowNumber: 3, name: 'Dana Cohen' }),
    emailKey: 'dana@example.com',
  })

  it('should name the member already holding the address', () => {
    expect(message).toContain('Dana Cohen')
    expect(message).toContain('row 3')
  })

  it('should say this applicant is somebody else, which is why it stopped', () => {
    expect(message).toMatch(/somebody else/i)
  })

  it('should offer the reviewer a way forward rather than only a refusal', () => {
    expect(message).toMatch(/their own address|by hand/i)
  })

  it('should describe an unnamed row without pretending it has a name', () => {
    expect(
      describeAddressTakenByAnotherMember({
        member: member({ name: undefined }),
        emailKey: 'dana@example.com',
      }),
    ).toMatch(/an unnamed row/i)
  })
})

describe('describeAlreadyDecided', () => {
  it('should repeat the decision the sheet already records', () => {
    expect(describeAlreadyDecided({ member: member(), recordedStatus: 'Declined' })).toContain(
      'already marked Declined',
    )
  })

  it('should fall back to the address when the member row has no name', () => {
    expect(
      describeAlreadyDecided({ member: member({ name: undefined }), recordedStatus: 'Approved' }),
    ).toContain('dana@example.com')
  })
})
