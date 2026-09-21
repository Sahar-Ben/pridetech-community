import { describe, expect, it } from 'vitest'
import { buildCompanyBreakdown } from './companyBreakdown'
import { buildDistribution } from './distribution'
import { describeCompanyCoverage, describeUnknownShare } from './overviewText'
import { buildMember } from '../../testing/memberFactory'

const distributionOf = ({ known, unknown }: { known: number; unknown: number }) =>
  buildDistribution([
    { key: 'known', label: 'Known', count: known, isUnknown: false },
    { key: 'unknown', label: 'Unknown', count: unknown, isUnknown: true },
  ])

describe('describeUnknownShare', () => {
  it('should say how many members the chart could not place, and what share that is', () => {
    expect(
      describeUnknownShare({
        distribution: distributionOf({ known: 3, unknown: 1 }),
        whatIsMissing: 'have no gender recorded',
      }),
    ).toBe('1 of 4 members (25%) have no gender recorded.')
  })

  it('should say plainly when there is no gap rather than printing a zero', () => {
    expect(
      describeUnknownShare({
        distribution: distributionOf({ known: 4, unknown: 0 }),
        whatIsMissing: 'have no gender recorded',
      }),
    ).toBe('Every one of the 4 members counted here is accounted for.')
  })

  it('should say there is nobody to count rather than dividing by zero', () => {
    expect(
      describeUnknownShare({
        distribution: distributionOf({ known: 0, unknown: 0 }),
        whatIsMissing: 'have no gender recorded',
      }),
    ).toBe('There are no members to count.')
  })
})

describe('describeCompanyCoverage', () => {
  it('should say what the ten shown leave out', () => {
    const members = [
      ...Array.from({ length: 12 }, (_member, index) =>
        buildMember({ rowNumber: index + 2, company: `Company ${index}` }),
      ),
      buildMember({ rowNumber: 20, company: undefined }),
    ]

    expect(describeCompanyCoverage(buildCompanyBreakdown(members))).toBe(
      'Showing the 10 largest of 12 company spellings. 2 members work somewhere else; 1 has no company recorded.',
    )
  })

  it('should not claim anything is left out when nothing is', () => {
    const members = [buildMember({ rowNumber: 2, company: 'Salted Mind' })]

    expect(describeCompanyCoverage(buildCompanyBreakdown(members))).toBe(
      'Showing all 1 company spelling. Every member counted here has a company recorded.',
    )
  })
})
