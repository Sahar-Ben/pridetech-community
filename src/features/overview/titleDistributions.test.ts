import { describe, expect, it } from 'vitest'
import { buildPositionDistribution, buildSeniorityDistribution } from './titleDistributions'
import { buildMember } from '../../testing/memberFactory'

const membersWithTitles = (titles: readonly (string | undefined)[]) =>
  titles.map((title, index) => buildMember({ rowNumber: index + 2, title }))

describe('buildPositionDistribution', () => {
  it('should count each member under the discipline read out of their title', () => {
    const distribution = buildPositionDistribution(
      membersWithTitles(['Backend Developer', 'iOS Developer', 'Product Manager']),
    )

    expect(distribution.buckets.map((bucket) => [bucket.label, bucket.count])).toEqual([
      ['Engineering', 2],
      ['Product', 1],
    ])
  })

  it('should put the largest discipline first', () => {
    const distribution = buildPositionDistribution(
      membersWithTitles(['Product Manager', 'Backend Developer', 'Frontend Developer']),
    )

    expect(distribution.buckets[0]?.label).toBe('Engineering')
  })

  it('should keep the unrecognised titles on the chart, last, rather than hiding them', () => {
    const distribution = buildPositionDistribution(
      membersWithTitles(['Chief Vibes Officer', 'Chief Vibes Officer', 'Backend Developer']),
    )

    expect(distribution.buckets.at(-1)?.label).toBe('Title not recognised')
    expect(distribution.unknownCount).toBe(2)
    expect(distribution.unknownPercentage).toBe(67)
  })

  it('should count a member with no title at all without crashing', () => {
    const distribution = buildPositionDistribution(membersWithTitles([undefined, 'QA Lead']))

    expect(distribution.total).toBe(2)
    expect(distribution.buckets.map((bucket) => bucket.label)).toContain('No title recorded')
  })

  it('should leave a discipline nobody works in off the chart', () => {
    const distribution = buildPositionDistribution(membersWithTitles(['Legal Counsel']))

    expect(distribution.buckets.map((bucket) => bucket.label)).toEqual(['Finance & legal'])
  })

  it('should count everybody exactly once', () => {
    const distribution = buildPositionDistribution(
      membersWithTitles(['Data Engineer', undefined, 'Chief Vibes Officer', 'UX Researcher']),
    )

    expect(distribution.buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(4)
  })

  it('should report nothing at all for an empty community', () => {
    expect(buildPositionDistribution([]).buckets).toEqual([])
  })
})

describe('buildSeniorityDistribution', () => {
  it('should keep the rungs in ladder order rather than in size order', () => {
    const distribution = buildSeniorityDistribution(
      membersWithTitles(['Junior Frontend Developer', 'Junior QA', 'VP R&D']),
    )

    expect(distribution.buckets.map((bucket) => bucket.key)).toEqual([
      'executive',
      'director',
      'manager',
      'lead',
      'senior',
      'junior',
      'no-level-stated',
      'no-title',
    ])
  })

  it('should count a title that states no level as stating no level', () => {
    const distribution = buildSeniorityDistribution(
      membersWithTitles(['Site Reliability Engineer', 'QA Lead']),
    )

    const noLevel = distribution.buckets.find((bucket) => bucket.key === 'no-level-stated')
    expect(noLevel?.count).toBe(1)
    expect(distribution.unknownCount).toBe(1)
  })

  it('should count a member with no title apart from one whose title states no level', () => {
    const distribution = buildSeniorityDistribution(
      membersWithTitles([undefined, 'Site Reliability Engineer']),
    )

    expect(distribution.buckets.find((bucket) => bucket.key === 'no-title')?.count).toBe(1)
    expect(distribution.unknownCount).toBe(2)
  })

  it('should count everybody exactly once', () => {
    const distribution = buildSeniorityDistribution(
      membersWithTitles(['Head of Product', 'Senior Backend Developer', undefined]),
    )

    expect(distribution.buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(3)
  })
})
