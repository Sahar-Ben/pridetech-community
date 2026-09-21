import { describe, expect, it } from 'vitest'
import { buildTenureDistribution } from './tenureDistribution'
import { buildLead } from '../../testing/leadFactory'
import { buildMember } from '../../testing/memberFactory'

const asOf = new Date(2026, 8, 21)

const countOf = ({
  distribution,
  key,
}: {
  distribution: ReturnType<typeof buildTenureDistribution>
  key: string
}): number => distribution.buckets.find((bucket) => bucket.key === key)?.count ?? 0

describe('buildTenureDistribution', () => {
  it('should band a member by the date of their own application', () => {
    const distribution = buildTenureDistribution({
      members: [buildMember({ mail: 'dana@example.com' })],
      leads: [buildLead({ email: 'dana@example.com', timestamp: '3/8/2022' })],
      asOf,
    })

    expect(countOf({ distribution, key: 'four-years-or-more' })).toBe(1)
  })

  it('should band a member with no matching application as unknown', () => {
    const distribution = buildTenureDistribution({
      members: [buildMember({ mail: 'dana@example.com' })],
      leads: [buildLead({ email: 'someone.else@example.com' })],
      asOf,
    })

    expect(countOf({ distribution, key: 'no-application' })).toBe(1)
    expect(distribution.unknownCount).toBe(1)
  })

  it('should match a member to their application whatever the case and spacing of the address', () => {
    const distribution = buildTenureDistribution({
      members: [buildMember({ mail: '  Dana@Example.COM ' })],
      leads: [buildLead({ email: 'dana@example.com', timestamp: '3/8/2026' })],
      asOf,
    })

    expect(countOf({ distribution, key: 'under-1-year' })).toBe(1)
    expect(distribution.unknownCount).toBe(0)
  })

  it('should band a member whose address cell is blank as unknown rather than matching a blank application', () => {
    const distribution = buildTenureDistribution({
      members: [buildMember({ mail: '' })],
      leads: [buildLead({ email: '', timestamp: '3/8/2022' })],
      asOf,
    })

    expect(countOf({ distribution, key: 'no-application' })).toBe(1)
  })

  it('should keep the bands in time order rather than in size order', () => {
    const distribution = buildTenureDistribution({
      members: [
        buildMember({ rowNumber: 2, mail: 'old@example.com' }),
        buildMember({ rowNumber: 3, mail: 'older@example.com' }),
        buildMember({ rowNumber: 4, mail: 'new@example.com' }),
      ],
      leads: [
        buildLead({ rowNumber: 2, email: 'old@example.com', timestamp: '3/8/2020' }),
        buildLead({ rowNumber: 3, email: 'older@example.com', timestamp: '3/8/2019' }),
        buildLead({ rowNumber: 4, email: 'new@example.com', timestamp: '3/8/2026' }),
      ],
      asOf,
    })

    expect(distribution.buckets.map((bucket) => bucket.key)).toEqual([
      'under-1-year',
      'one-to-two-years',
      'two-to-four-years',
      'four-years-or-more',
      'no-application',
    ])
  })

  it('should count everybody exactly once across the bands', () => {
    const distribution = buildTenureDistribution({
      members: [
        buildMember({ rowNumber: 2, mail: 'a@example.com' }),
        buildMember({ rowNumber: 3, mail: 'b@example.com' }),
        buildMember({ rowNumber: 4, mail: 'c@example.com' }),
      ],
      leads: [buildLead({ email: 'a@example.com', timestamp: '3/8/2024' })],
      asOf,
    })

    const counted = distribution.buckets.reduce((sum, bucket) => sum + bucket.count, 0)
    expect(counted).toBe(3)
    expect(distribution.total).toBe(3)
  })

  it('should report no tenure at all when the community is empty', () => {
    const distribution = buildTenureDistribution({ members: [], leads: [], asOf })

    expect(distribution.total).toBe(0)
    expect(distribution.unknownPercentage).toBe(0)
  })
})
