import { describe, expect, it } from 'vitest'
import { buildCompanyBreakdown, TOP_COMPANY_COUNT } from './companyBreakdown'
import { buildMember } from '../../testing/memberFactory'

const membersAt = (companies: readonly (string | undefined)[]) =>
  companies.map((company, index) => buildMember({ rowNumber: index + 2, company }))

const repeat = ({ company, times }: { company: string; times: number }): readonly string[] =>
  Array.from({ length: times }, () => company)

describe('buildCompanyBreakdown', () => {
  it('should count distinct spellings rather than distinct companies', () => {
    const breakdown = buildCompanyBreakdown(membersAt(['Google', 'google', 'Google Israel']))

    expect(breakdown.distinctCompanyCount).toBe(2)
  })

  it('should show at most ten companies', () => {
    const companies = Array.from({ length: 14 }, (_company, index) => `Company ${index}`)

    const breakdown = buildCompanyBreakdown(membersAt(companies))

    expect(breakdown.buckets.filter((bucket) => !bucket.isUnknown)).toHaveLength(TOP_COMPANY_COUNT)
  })

  it('should cut the top ten by member count and settle ties by name', () => {
    const breakdown = buildCompanyBreakdown(
      membersAt([...repeat({ company: 'Zebra Labs', times: 2 }), 'Alpha Works', 'Beta Works']),
    )

    expect(breakdown.buckets.map((bucket) => bucket.label)).toEqual([
      'Zebra Labs',
      'Alpha Works',
      'Beta Works',
    ])
  })

  it('should report each company as a share of everybody, not of the ten shown', () => {
    const breakdown = buildCompanyBreakdown(
      membersAt([...repeat({ company: 'Big Co', times: 5 }), ...repeat({ company: 'x', times: 5 })]),
    )

    expect(breakdown.buckets.find((bucket) => bucket.label === 'Big Co')?.percentage).toBe(50)
  })

  it('should measure a company against everybody, including the members it does not show', () => {
    const companies = [
      ...repeat({ company: 'Big Co', times: 5 }),
      ...Array.from({ length: 12 }, (_company, index) => `Small Co ${index}`),
      ...repeat({ company: '', times: 3 }),
    ]

    const breakdown = buildCompanyBreakdown(membersAt(companies))

    expect(breakdown.buckets.find((bucket) => bucket.label === 'Big Co')?.percentage).toBe(25)
    expect(breakdown.buckets.at(-1)?.percentage).toBe(15)
  })

  it('should keep the members with no company on the chart as their own bar', () => {
    const breakdown = buildCompanyBreakdown(membersAt(['Big Co', undefined, undefined]))

    const noCompany = breakdown.buckets.at(-1)
    expect(noCompany?.isUnknown).toBe(true)
    expect(noCompany?.count).toBe(2)
    expect(breakdown.membersWithoutCompanyCount).toBe(2)
  })

  it('should report how many members and companies the chart leaves out', () => {
    const companies = Array.from({ length: 12 }, (_company, index) => `Company ${index}`)

    const breakdown = buildCompanyBreakdown(membersAt(companies))

    expect(breakdown.companiesNotShownCount).toBe(2)
    expect(breakdown.membersNotShownCount).toBe(2)
  })

  it('should count a member with no company without crashing or dropping them', () => {
    const breakdown = buildCompanyBreakdown(membersAt([undefined]))

    expect(breakdown.totalMemberCount).toBe(1)
    expect(breakdown.distinctCompanyCount).toBe(0)
  })

  it('should report an empty community as empty', () => {
    const breakdown = buildCompanyBreakdown([])

    expect(breakdown.buckets).toEqual([])
    expect(breakdown.distinctCompanyCount).toBe(0)
    expect(breakdown.totalMemberCount).toBe(0)
  })
})
