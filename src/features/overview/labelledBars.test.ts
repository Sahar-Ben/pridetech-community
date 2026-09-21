import { describe, expect, it } from 'vitest'
import { toLabelledBarKeys } from './labelledBars'
import type { DistributionBucket } from './distribution'

const bucket = ({
  key,
  count,
  isUnknown = false,
}: {
  key: string
  count: number
  isUnknown?: boolean
}): DistributionBucket => ({ key, label: key, count, percentage: count, isUnknown })

const ranked = (counts: readonly number[]): readonly DistributionBucket[] =>
  counts.map((count, index) => bucket({ key: `rank-${index}`, count }))

describe('toLabelledBarKeys', () => {
  it('should label the five largest bars', () => {
    const keys = toLabelledBarKeys(ranked([90, 80, 70, 60, 50, 40, 30]))

    expect([...keys].toSorted()).toEqual(['rank-0', 'rank-1', 'rank-2', 'rank-3', 'rank-4'])
  })

  it('should leave the sixth largest bar to the tooltip', () => {
    const keys = toLabelledBarKeys(ranked([90, 80, 70, 60, 50, 40]))

    expect(keys.has('rank-5')).toBe(false)
  })

  it('should pick the five largest by value rather than the first five drawn', () => {
    const keys = toLabelledBarKeys(ranked([1, 1, 1, 1, 1, 99]))

    expect(keys.has('rank-5')).toBe(true)
  })

  it('should label a bucket nobody could be placed in however small it is', () => {
    const buckets = [
      ...ranked([90, 80, 70, 60, 50]),
      bucket({ key: 'unclassified', count: 1, isUnknown: true }),
    ]

    const keys = toLabelledBarKeys(buckets)

    expect(keys.has('unclassified')).toBe(true)
    expect(keys.size).toBe(6)
  })

  it('should label every unknown bucket, not just the first', () => {
    const buckets = [
      ...ranked([90, 80, 70, 60, 50, 40]),
      bucket({ key: 'no-title', count: 2, isUnknown: true }),
      bucket({ key: 'unclassified', count: 1, isUnknown: true }),
    ]

    const keys = toLabelledBarKeys(buckets)

    expect(keys.has('no-title')).toBe(true)
    expect(keys.has('unclassified')).toBe(true)
  })

  it('should not spend one of the five on an unknown bucket', () => {
    const buckets = [
      bucket({ key: 'unclassified', count: 500, isUnknown: true }),
      ...ranked([90, 80, 70, 60, 50]),
    ]

    const keys = toLabelledBarKeys(buckets)

    expect(keys.has('rank-4')).toBe(true)
    expect(keys.size).toBe(6)
  })

  it('should not label one of two bars the reader can see are the same size', () => {
    const keys = toLabelledBarKeys(ranked([2, 2, 2, 2, 1, 1, 1]))

    expect(keys.size).toBe(4)
    expect(keys.has('rank-4')).toBe(false)
  })

  it('should still label the largest bars when every bar is the same size', () => {
    expect(toLabelledBarKeys(ranked([1, 1, 1, 1, 1, 1, 1])).size).toBe(5)
  })

  it('should settle a tie at the cut the same way every time', () => {
    const buckets = [
      bucket({ key: 'alpha', count: 5 }),
      bucket({ key: 'zebra', count: 5 }),
      bucket({ key: 'other', count: 9 }),
    ]

    expect([...toLabelledBarKeys(buckets)].toSorted()).toEqual(['alpha', 'other', 'zebra'])
  })

  it('should label everything on a chart with fewer than five bars', () => {
    expect(toLabelledBarKeys(ranked([3, 2])).size).toBe(2)
  })

  it('should label nothing on a chart with nothing in it', () => {
    expect(toLabelledBarKeys([]).size).toBe(0)
  })
})
