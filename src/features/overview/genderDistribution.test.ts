import { describe, expect, it } from 'vitest'
import { buildGenderDistribution } from './genderDistribution'
import { calculateGenderSplit } from '../members/genderSplit'
import { buildMember } from '../../testing/memberFactory'

describe('buildGenderDistribution', () => {
  it('should count a blank gender cell as its own slice rather than dropping it', () => {
    const distribution = buildGenderDistribution([
      buildMember({ rowNumber: 2, gender: 'F' }),
      buildMember({ rowNumber: 3, gender: 'M' }),
      buildMember({ rowNumber: 4, gender: undefined }),
      buildMember({ rowNumber: 5, gender: undefined }),
    ])

    expect(
      distribution.buckets.map((bucket) => [bucket.label, bucket.count, bucket.percentage]),
    ).toEqual([
      ['Women', 1, 25],
      ['Men', 1, 25],
      ['Not recorded', 2, 50],
    ])
  })

  it('should total 100 percent across the three slices', () => {
    const distribution = buildGenderDistribution([
      buildMember({ rowNumber: 2, gender: 'F' }),
      buildMember({ rowNumber: 3, gender: 'M' }),
      buildMember({ rowNumber: 4, gender: undefined }),
    ])

    const total = distribution.buckets.reduce((sum, bucket) => sum + bucket.percentage, 0)
    expect(total).toBe(100)
  })

  it('should mark the unrecorded slice as unknown so the chart can say so', () => {
    const distribution = buildGenderDistribution([buildMember({ rowNumber: 2, gender: undefined })])

    expect(distribution.unknownCount).toBe(1)
    expect(distribution.unknownPercentage).toBe(100)
  })

  it('should agree with the gender split the members summary already shows', () => {
    const members = [
      buildMember({ rowNumber: 2, gender: 'F' }),
      buildMember({ rowNumber: 3, gender: 'F' }),
      buildMember({ rowNumber: 4, gender: 'M' }),
      buildMember({ rowNumber: 5, gender: undefined }),
      buildMember({ rowNumber: 6, gender: undefined }),
      buildMember({ rowNumber: 7, gender: undefined }),
      buildMember({ rowNumber: 8, gender: 'M' }),
    ]
    const split = calculateGenderSplit(members)

    const distribution = buildGenderDistribution(members)

    expect(distribution.buckets.map((bucket) => bucket.percentage)).toEqual([
      split.womenPercentage,
      split.menPercentage,
      split.unrecordedPercentage,
    ])
  })

  it('should keep every slice on the chart when nobody has been counted', () => {
    const distribution = buildGenderDistribution([])

    expect(distribution.total).toBe(0)
    expect(distribution.buckets.map((bucket) => bucket.count)).toEqual([0, 0, 0])
  })
})
