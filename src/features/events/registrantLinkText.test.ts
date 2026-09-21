import { describe, expect, it } from 'vitest'
import { describeNonMemberMarker } from './registrantLinkText'

describe('describeNonMemberMarker', () => {
  it('should stay silent for a matched member, because that is almost everybody', () => {
    expect(
      describeNonMemberMarker({ kind: 'member', memberName: 'Dana Sorkin', rowNumber: 2 }),
    ).toBeUndefined()
  })

  it('should mark somebody whose email is in no member row', () => {
    expect(describeNonMemberMarker({ kind: 'unmatched' })).toBe('Not in the member list')
  })

  it('should name the member a guest came with', () => {
    expect(describeNonMemberMarker({ kind: 'guest', hostName: 'Dana Sorkin' })).toBe(
      'Guest of Dana Sorkin',
    )
  })

  it('should not call a row from a sheet with no email column a non-member', () => {
    expect(describeNonMemberMarker({ kind: 'no-email' })).toBeUndefined()
  })
})
