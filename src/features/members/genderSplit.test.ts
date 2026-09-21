import { describe, expect, it } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { calculateGenderSplit } from './genderSplit'
import type { Member, MemberGender } from './member'

const buildMembersWithGender = ({
  count,
  firstRowNumber,
  gender,
}: {
  count: number
  firstRowNumber: number
  gender: MemberGender | undefined
}): readonly Member[] =>
  [...Array(count).keys()].map((offset) =>
    buildMember({ rowNumber: firstRowNumber + offset, gender }),
  )

describe('calculateGenderSplit', () => {
  it('should report women, men and unrecorded as shares of everyone counted', () => {
    const split = calculateGenderSplit([
      buildMember({ rowNumber: 2, gender: 'F' }),
      buildMember({ rowNumber: 3, gender: 'F' }),
      buildMember({ rowNumber: 4, gender: 'M' }),
      buildMember({ rowNumber: 5, gender: undefined }),
    ])

    expect(split).toEqual({
      total: 4,
      womenCount: 2,
      menCount: 1,
      unrecordedCount: 1,
      womenPercentage: 50,
      menPercentage: 25,
      unrecordedPercentage: 25,
    })
  })

  it('should measure women against everyone rather than against the members whose gender is filled in', () => {
    const split = calculateGenderSplit([
      buildMember({ rowNumber: 2, gender: 'F' }),
      buildMember({ rowNumber: 3, gender: undefined }),
      buildMember({ rowNumber: 4, gender: undefined }),
      buildMember({ rowNumber: 5, gender: undefined }),
    ])

    expect(split.womenPercentage).toBe(25)
    expect(split.unrecordedPercentage).toBe(75)
  })

  it('should count every member exactly once across the three groups', () => {
    const split = calculateGenderSplit([
      buildMember({ rowNumber: 2, gender: 'F' }),
      buildMember({ rowNumber: 3, gender: 'M' }),
      buildMember({ rowNumber: 4, gender: undefined }),
      buildMember({ rowNumber: 5, gender: undefined }),
      buildMember({ rowNumber: 6, gender: 'M' }),
    ])

    expect(split.womenCount + split.menCount + split.unrecordedCount).toBe(split.total)
  })

  it('should report percentages as whole numbers that add up to 100', () => {
    const split = calculateGenderSplit([
      buildMember({ rowNumber: 2, gender: 'F' }),
      buildMember({ rowNumber: 3, gender: 'M' }),
      buildMember({ rowNumber: 4, gender: undefined }),
    ])

    expect(split.womenPercentage + split.menPercentage + split.unrecordedPercentage).toBe(100)
    expect([split.womenPercentage, split.menPercentage, split.unrecordedPercentage]).toEqual([
      34, 33, 33,
    ])
  })

  it('should still add up to 100 when no group divides evenly', () => {
    const members = [
      ...buildMembersWithGender({ count: 10, firstRowNumber: 100, gender: 'F' }),
      ...buildMembersWithGender({ count: 5, firstRowNumber: 200, gender: 'M' }),
      ...buildMembersWithGender({ count: 6, firstRowNumber: 300, gender: undefined }),
    ]

    const split = calculateGenderSplit(members)

    expect(split.womenPercentage).toBe(48)
    expect(split.womenPercentage + split.menPercentage + split.unrecordedPercentage).toBe(100)
  })

  it('should report zeroes rather than dividing by zero when there is nobody to count', () => {
    const split = calculateGenderSplit([])

    expect(split).toEqual({
      total: 0,
      womenCount: 0,
      menCount: 0,
      unrecordedCount: 0,
      womenPercentage: 0,
      menPercentage: 0,
      unrecordedPercentage: 0,
    })
  })
})
