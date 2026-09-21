import { describe, expect, it } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { filterMembers, selectActiveMembers } from './memberFilters'

const dana = buildMember({
  rowNumber: 2,
  name: 'Dana Sorkin',
  mail: 'dana.sorkin@example.com',
  company: 'Ridgeway Systems',
})

const tomer = buildMember({
  rowNumber: 3,
  name: 'Tomer Reznik',
  mail: 'tomer.reznik@example.com',
  company: 'Palewood Analytics',
})

const formerMember = buildMember({
  rowNumber: 4,
  name: 'Gaya Ronen',
  mail: 'gaya.ronen@example.com',
  company: 'Ridgeway Systems',
  status: 'Ex-member',
  removalReason: 'Moved abroad',
})

const everyone = [dana, tomer, formerMember]

const namesFrom = (members: readonly ReturnType<typeof buildMember>[]): readonly string[] =>
  members.map((member) => member.name)

describe('filterMembers', () => {
  it('should return every active member when the search box is empty', () => {
    const matched = filterMembers({ members: everyone, searchText: '', statusFilter: 'Active' })

    expect(namesFrom(matched)).toEqual(['Dana Sorkin', 'Tomer Reznik'])
  })

  it('should match on name', () => {
    const matched = filterMembers({ members: everyone, searchText: 'Reznik', statusFilter: 'All' })

    expect(namesFrom(matched)).toEqual(['Tomer Reznik'])
  })

  it('should match on email', () => {
    const matched = filterMembers({
      members: everyone,
      searchText: 'dana.sorkin@example.com',
      statusFilter: 'All',
    })

    expect(namesFrom(matched)).toEqual(['Dana Sorkin'])
  })

  it('should match on company', () => {
    const matched = filterMembers({
      members: everyone,
      searchText: 'Palewood',
      statusFilter: 'All',
    })

    expect(namesFrom(matched)).toEqual(['Tomer Reznik'])
  })

  it('should ignore letter case', () => {
    const matched = filterMembers({ members: everyone, searchText: 'dAnA', statusFilter: 'All' })

    expect(namesFrom(matched)).toEqual(['Dana Sorkin'])
  })

  it('should ignore surrounding whitespace', () => {
    const matched = filterMembers({
      members: everyone,
      searchText: '   Reznik  ',
      statusFilter: 'All',
    })

    expect(namesFrom(matched)).toEqual(['Tomer Reznik'])
  })

  it('should return nobody when the search matches no member', () => {
    const matched = filterMembers({
      members: everyone,
      searchText: 'nobody-by-this-name',
      statusFilter: 'All',
    })

    expect(matched).toEqual([])
  })

  it('should not match a member whose company is empty against a company search', () => {
    const withoutCompany = buildMember({ rowNumber: 5, name: 'Roni Halperin', company: undefined })

    const matched = filterMembers({
      members: [withoutCompany],
      searchText: 'Ridgeway',
      statusFilter: 'All',
    })

    expect(matched).toEqual([])
  })

  it('should show only ex-members when the status filter asks for them', () => {
    const matched = filterMembers({
      members: everyone,
      searchText: '',
      statusFilter: 'Ex-member',
    })

    expect(namesFrom(matched)).toEqual(['Gaya Ronen'])
  })

  it('should show everyone when the status filter is All', () => {
    const matched = filterMembers({ members: everyone, searchText: '', statusFilter: 'All' })

    expect(namesFrom(matched)).toEqual(['Dana Sorkin', 'Tomer Reznik', 'Gaya Ronen'])
  })

  it('should apply the search and the status filter together', () => {
    const matched = filterMembers({
      members: everyone,
      searchText: 'Ridgeway',
      statusFilter: 'Active',
    })

    expect(namesFrom(matched)).toEqual(['Dana Sorkin'])
  })
})

describe('selectActiveMembers', () => {
  it('should keep only the members who are still in the community', () => {
    expect(namesFrom(selectActiveMembers(everyone))).toEqual(['Dana Sorkin', 'Tomer Reznik'])
  })
})
