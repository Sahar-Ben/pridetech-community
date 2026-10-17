import { describe, expect, it } from 'vitest'
import { buildMemberEmailList } from './memberEmailList'
import { buildMember } from '../../testing/memberFactory'

describe('buildMemberEmailList', () => {
  it('should list main addresses in a form Gmail takes as pasted', () => {
    const list = buildMemberEmailList([
      buildMember({ rowNumber: 2, mail: 'dana@example.com' }),
      buildMember({ rowNumber: 3, mail: ' noa@example.com ' }),
    ])

    expect(list.text).toBe('dana@example.com, noa@example.com')
    expect(list.emailCount).toBe(2)
  })

  it('should list an address on two rows once', () => {
    const list = buildMemberEmailList([
      buildMember({ rowNumber: 2, mail: 'dana@example.com' }),
      buildMember({ rowNumber: 3, mail: 'Dana@Example.com' }),
    ])

    expect(list.text).toBe('dana@example.com')
    expect(list.repeatedCount).toBe(1)
  })

  it('should count the members with no address rather than leave a gap in the list', () => {
    const list = buildMemberEmailList([
      buildMember({ rowNumber: 2, mail: '' }),
      buildMember({ rowNumber: 3, mail: 'noa@example.com' }),
    ])

    expect(list).toEqual({
      text: 'noa@example.com',
      emailCount: 1,
      withoutEmailCount: 1,
      repeatedCount: 0,
    })
  })

  it('should leave other emails out, so each person is written to once', () => {
    const list = buildMemberEmailList([
      buildMember({ mail: 'dana@example.com', otherEmails: ['dana@work.example.com'] }),
    ])

    expect(list.text).toBe('dana@example.com')
  })
})
