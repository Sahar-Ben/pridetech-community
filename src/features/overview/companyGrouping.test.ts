import { describe, expect, it } from 'vitest'
import { groupMembersByCompany, toCompanyKey } from './companyGrouping'
import { buildMember } from '../../testing/memberFactory'

const membersAt = (companies: readonly (string | undefined)[]) =>
  companies.map((company, index) => buildMember({ rowNumber: index + 2, company }))

describe('toCompanyKey', () => {
  it('should read two spellings that differ only in case as the same company', () => {
    expect(toCompanyKey('Google')).toBe(toCompanyKey('google'))
  })

  it('should read two spellings that differ only in spacing as the same company', () => {
    expect(toCompanyKey('  Salted   Mind ')).toBe(toCompanyKey('Salted Mind'))
  })

  it('should keep two companies whose names differ apart', () => {
    expect(toCompanyKey('Google')).not.toBe(toCompanyKey('Google Israel'))
    expect(toCompanyKey('Google Cloud')).not.toBe(toCompanyKey('Google'))
  })
})

describe('groupMembersByCompany', () => {
  it('should count the spellings of one company as one company', () => {
    const grouped = groupMembersByCompany(membersAt(['Google', 'google', ' GOOGLE ']))

    expect(grouped.groups).toHaveLength(1)
    expect(grouped.groups[0]?.count).toBe(3)
  })

  it('should show the spelling most people used rather than the key it counted on', () => {
    const grouped = groupMembersByCompany(membersAt(['google', 'Google', 'Google']))

    expect(grouped.groups[0]?.label).toBe('Google')
  })

  it('should settle a tie between two equally common spellings the same way every time', () => {
    const grouped = groupMembersByCompany(membersAt(['google', 'Google']))

    expect(grouped.groups[0]?.label).toBe('Google')
  })

  it('should keep companies whose names merely look similar apart', () => {
    const grouped = groupMembersByCompany(membersAt(['Google', 'Google Israel', 'Google Cloud']))

    expect(grouped.groups).toHaveLength(3)
  })

  it('should count the members with no company of their own', () => {
    const grouped = groupMembersByCompany(membersAt(['Google', undefined, undefined]))

    expect(grouped.membersWithoutCompanyCount).toBe(2)
    expect(grouped.groups).toHaveLength(1)
  })

  it('should treat a company cell holding only spaces as no company', () => {
    const grouped = groupMembersByCompany(membersAt(['   ']))

    expect(grouped.membersWithoutCompanyCount).toBe(1)
    expect(grouped.groups).toEqual([])
  })

  it('should put the largest employer first and settle ties by name', () => {
    const grouped = groupMembersByCompany(
      membersAt(['Zebra Labs', 'Alpha Works', 'Big Co', 'Big Co']),
    )

    expect(grouped.groups.map((group) => group.label)).toEqual([
      'Big Co',
      'Alpha Works',
      'Zebra Labs',
    ])
  })

  it('should report no groups for a community with nobody in it', () => {
    const grouped = groupMembersByCompany([])

    expect(grouped).toEqual({ groups: [], membersWithoutCompanyCount: 0 })
  })
})
