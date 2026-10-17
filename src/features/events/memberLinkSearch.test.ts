import { describe, expect, it } from 'vitest'
import { searchMembersToLink } from './memberLinkSearch'
import { buildMember } from '../../testing/memberFactory'

const dana = buildMember({ rowNumber: 2, name: 'Dana Sorkin', mail: 'dana@example.com' })
const noa = buildMember({
  rowNumber: 3,
  name: 'Noa Levi',
  mail: 'noa@example.com',
  otherEmails: ['noa@work.example.com'],
})

describe('searchMembersToLink', () => {
  it('should find a member by every word of their name, in any order', () => {
    expect(searchMembersToLink({ members: [dana, noa], searchText: 'sorkin dana' })).toEqual([dana])
  })

  it('should find a member by one of their other emails', () => {
    expect(searchMembersToLink({ members: [dana, noa], searchText: 'work.example' })).toEqual([noa])
  })

  it('should offer nobody before anything is typed', () => {
    expect(searchMembersToLink({ members: [dana, noa], searchText: '  ' })).toEqual([])
  })

  it('should offer no more than a screenful', () => {
    const members = Array.from({ length: 20 }, (_unused, index) =>
      buildMember({ rowNumber: index + 2, name: `Dana ${index}` }),
    )

    expect(searchMembersToLink({ members, searchText: 'dana' })).toHaveLength(8)
  })
})
