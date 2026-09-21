import { describe, expect, it } from 'vitest'
import { buildDistribution, sortTalliesByCount } from './distribution'

describe('buildDistribution', () => {
  it('should report each bucket as a whole percentage of everyone counted', () => {
    const distribution = buildDistribution([
      { key: 'women', label: 'Women', count: 2, isUnknown: false },
      { key: 'men', label: 'Men', count: 1, isUnknown: false },
      { key: 'unrecorded', label: 'Not recorded', count: 1, isUnknown: true },
    ])

    expect(distribution.total).toBe(4)
    expect(distribution.buckets.map((bucket) => bucket.percentage)).toEqual([50, 25, 25])
  })

  it('should keep every bucket in the order it was tallied', () => {
    const distribution = buildDistribution([
      { key: 'a', label: 'A', count: 1, isUnknown: false },
      { key: 'b', label: 'B', count: 9, isUnknown: false },
    ])

    expect(distribution.buckets.map((bucket) => bucket.key)).toEqual(['a', 'b'])
  })

  it('should report the unknown share separately without dropping it from the total', () => {
    const distribution = buildDistribution([
      { key: 'known', label: 'Known', count: 3, isUnknown: false },
      { key: 'unknown', label: 'Unknown', count: 1, isUnknown: true },
    ])

    expect(distribution.total).toBe(4)
    expect(distribution.unknownCount).toBe(1)
    expect(distribution.unknownPercentage).toBe(25)
  })

  it('should add every unknown bucket into the unknown share', () => {
    const distribution = buildDistribution([
      { key: 'known', label: 'Known', count: 2, isUnknown: false },
      { key: 'no-title', label: 'No title', count: 1, isUnknown: true },
      { key: 'unclassified', label: 'Not classified', count: 1, isUnknown: true },
    ])

    expect(distribution.unknownCount).toBe(2)
    expect(distribution.unknownPercentage).toBe(50)
  })

  it('should report zeroes rather than dividing by zero when nobody was counted', () => {
    const distribution = buildDistribution([
      { key: 'women', label: 'Women', count: 0, isUnknown: false },
    ])

    expect(distribution.total).toBe(0)
    expect(distribution.unknownPercentage).toBe(0)
    expect(distribution.buckets[0]?.percentage).toBe(0)
  })

  it('should report no buckets when nothing was tallied', () => {
    expect(buildDistribution([])).toEqual({
      buckets: [],
      total: 0,
      unknownCount: 0,
      unknownPercentage: 0,
    })
  })
})

describe('sortTalliesByCount', () => {
  it('should put the largest count first', () => {
    const sorted = sortTalliesByCount([
      { key: 'a', label: 'A', count: 1, isUnknown: false },
      { key: 'b', label: 'B', count: 9, isUnknown: false },
    ])

    expect(sorted.map((tally) => tally.key)).toEqual(['b', 'a'])
  })

  it('should break a tie by label so the same data always draws the same chart', () => {
    const sorted = sortTalliesByCount([
      { key: 'zebra', label: 'Zebra', count: 4, isUnknown: false },
      { key: 'alpha', label: 'Alpha', count: 4, isUnknown: false },
    ])

    expect(sorted.map((tally) => tally.key)).toEqual(['alpha', 'zebra'])
  })

  it('should keep an unknown bucket last however large it is', () => {
    const sorted = sortTalliesByCount([
      { key: 'a', label: 'A', count: 1, isUnknown: false },
      { key: 'unclassified', label: 'Not classified', count: 99, isUnknown: true },
      { key: 'b', label: 'B', count: 2, isUnknown: false },
    ])

    expect(sorted.map((tally) => tally.key)).toEqual(['b', 'a', 'unclassified'])
  })

  it('should leave a bucket nobody landed in out of the chart', () => {
    const sorted = sortTalliesByCount([
      { key: 'a', label: 'A', count: 3, isUnknown: false },
      { key: 'empty', label: 'Empty', count: 0, isUnknown: false },
    ])

    expect(sorted.map((tally) => tally.key)).toEqual(['a'])
  })
})
