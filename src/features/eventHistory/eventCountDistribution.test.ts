import { describe, expect, it } from 'vitest'
import { buildEventCountDistribution } from './eventCountDistribution'
import { buildMember } from '../../testing/memberFactory'

const members = [2, 3, 4, 5, 6].map((rowNumber) => buildMember({ rowNumber }))

describe('buildEventCountDistribution', () => {
  it('should band every member by how many events they have been to, in that order', () => {
    const distribution = buildEventCountDistribution({
      members,
      counts: new Map([
        [3, 1],
        [4, 2],
        [5, 3],
        [6, 7],
      ]),
    })

    expect(distribution.buckets.map(({ key, count }) => [key, count])).toEqual([
      ['none', 1],
      ['one', 1],
      ['two', 1],
      ['three-or-more', 2],
    ])
    expect(distribution.total).toBe(5)
  })

  it('should keep an empty band rather than drop it, so the four bars never move', () => {
    const distribution = buildEventCountDistribution({ members, counts: new Map() })

    expect(distribution.buckets.map(({ count }) => count)).toEqual([5, 0, 0, 0])
  })
})
