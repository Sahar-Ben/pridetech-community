import { describe, expect, it } from 'vitest'
import { buildRegistrant } from '../../testing/eventFactory'
import { buildMember } from '../../testing/memberFactory'
import { searchCommunityMembers } from './communitySearch'
import type { CommunitySearchResult } from './communitySearch'

const dana = buildMember({ rowNumber: 2, name: 'Dana Sorkin', mail: 'dana.sorkin@example.com' })
const ori = buildMember({ rowNumber: 3, name: 'Ori Weintraub', mail: 'ori.weintraub@example.com' })
const gaya = buildMember({
  rowNumber: 4,
  name: 'Gaya Ronen',
  mail: 'gaya.ronen@example.com',
  status: 'Ex-member',
})

const community = [dana, ori, gaya]

const namesOf = (results: readonly CommunitySearchResult[]): readonly string[] =>
  results.map((result) => result.member.name)

describe('searchCommunityMembers', () => {
  it('should find a member by the first letters of their name', () => {
    const results = searchCommunityMembers({
      members: community,
      registrants: [],
      searchText: 'dan',
    })

    expect(namesOf(results)).toEqual(['Dana Sorkin'])
  })

  it('should find a member by email', () => {
    const results = searchCommunityMembers({
      members: community,
      registrants: [],
      searchText: 'ori.weintraub@',
    })

    expect(namesOf(results)).toEqual(['Ori Weintraub'])
  })

  it('should narrow on each word typed, so a first and last initial is enough', () => {
    const results = searchCommunityMembers({
      members: community,
      registrants: [],
      searchText: 'da sor',
    })

    expect(namesOf(results)).toEqual(['Dana Sorkin'])
  })

  it('should ignore capitals, since nobody types them at a door', () => {
    const results = searchCommunityMembers({
      members: community,
      registrants: [],
      searchText: 'DANA',
    })

    expect(namesOf(results)).toEqual(['Dana Sorkin'])
  })

  it('should show nobody until something is typed, rather than the whole community', () => {
    expect(searchCommunityMembers({ members: community, registrants: [], searchText: '' })).toEqual(
      [],
    )
  })

  it('should return nobody when the search matches nobody', () => {
    expect(
      searchCommunityMembers({ members: community, registrants: [], searchText: 'zzz' }),
    ).toEqual([])
  })

  it('should still find an ex-member, so the door can see who is asking', () => {
    const results = searchCommunityMembers({
      members: community,
      registrants: [],
      searchText: 'gaya',
    })

    expect(namesOf(results)).toEqual(['Gaya Ronen'])
  })
})

describe('searchCommunityMembers duplicate detection', () => {
  const danaAlreadyRegistered = buildRegistrant({
    id: 'r1',
    name: 'Dana Sorkin',
    email: 'dana.sorkin@example.com',
  })

  it('should hand back the registration a member already has on this event', () => {
    const results = searchCommunityMembers({
      members: community,
      registrants: [danaAlreadyRegistered],
      searchText: 'dana',
    })

    expect(results[0]?.existingRegistrant).toEqual(danaAlreadyRegistered)
  })

  it('should match the registration however the email was capitalised on the form', () => {
    const results = searchCommunityMembers({
      members: community,
      registrants: [{ ...danaAlreadyRegistered, email: ' Dana.Sorkin@Example.com ' }],
      searchText: 'dana',
    })

    expect(results[0]?.existingRegistrant?.id).toBe('r1')
  })

  it('should leave the registration absent for a member nobody has registered', () => {
    const results = searchCommunityMembers({
      members: community,
      registrants: [danaAlreadyRegistered],
      searchText: 'ori',
    })

    expect(results[0]?.existingRegistrant).toBeUndefined()
  })

  it('should not confuse a member with a registrant of some other event', () => {
    const results = searchCommunityMembers({
      members: community,
      registrants: [buildRegistrant({ id: 'r9', name: 'Someone Else', email: 'else@example.com' })],
      searchText: 'dana',
    })

    expect(results[0]?.existingRegistrant).toBeUndefined()
  })
})
