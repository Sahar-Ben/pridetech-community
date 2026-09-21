import { describe, expect, it } from 'vitest'
import { allocateWholePercentages } from './wholePercentages'

describe('allocateWholePercentages', () => {
  it('should report exact shares unchanged when every share is already whole', () => {
    expect(allocateWholePercentages([2, 1, 1])).toEqual([50, 25, 25])
  })

  it('should add up to 100 when no share divides evenly', () => {
    const percentages = allocateWholePercentages([1, 1, 1])

    expect(percentages.reduce((total, share) => total + share, 0)).toBe(100)
    expect(percentages).toEqual([34, 33, 33])
  })

  it('should give the leftover points to the shares cut hardest rather than rounding each alone', () => {
    const percentages = allocateWholePercentages([10, 5, 6])

    expect(percentages).toEqual([48, 24, 28])
    expect(percentages.reduce((total, share) => total + share, 0)).toBe(100)
  })

  it('should still total 100 across many uneven shares', () => {
    const percentages = allocateWholePercentages([7, 7, 7, 7, 7, 7, 7])

    expect(percentages.reduce((total, share) => total + share, 0)).toBe(100)
  })

  it('should report zeroes rather than dividing by zero when there is nothing to count', () => {
    expect(allocateWholePercentages([0, 0])).toEqual([0, 0])
  })

  it('should report no shares when there are no counts', () => {
    expect(allocateWholePercentages([])).toEqual([])
  })

  it('should give an empty group a zero share rather than a rounding leftover', () => {
    expect(allocateWholePercentages([1, 0])).toEqual([100, 0])
  })
})
