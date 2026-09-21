import { describe, expect, it } from 'vitest'
import { buildOverview } from './buildOverview'
import { buildLead } from '../../testing/leadFactory'
import { buildMember } from '../../testing/memberFactory'

const asOf = new Date(2026, 8, 21)

describe('buildOverview', () => {
  it('should draw every chart from the active members alone', () => {
    const overview = buildOverview({
      members: [
        buildMember({ rowNumber: 2, gender: 'F', status: 'Active' }),
        buildMember({ rowNumber: 3, gender: 'M', status: 'Ex-member' }),
      ],
      leads: [],
      asOf,
    })

    expect(overview.memberCount).toBe(1)
    expect(overview.exMemberCount).toBe(1)
    expect(overview.gender.total).toBe(1)
    expect(overview.companies.totalMemberCount).toBe(1)
  })

  it('should carry every distribution the dashboard draws', () => {
    const overview = buildOverview({
      members: [buildMember({ rowNumber: 2, title: 'Head of Product', company: 'Salted Mind' })],
      leads: [buildLead({ email: 'sample.person@example.com', timestamp: '3/8/2022' })],
      asOf,
    })

    expect(overview.gender.total).toBe(1)
    expect(overview.tenure.buckets.find((bucket) => bucket.key === 'four-years-or-more')?.count).toBe(1)
    expect(overview.position.buckets[0]?.label).toBe('Product')
    expect(overview.seniority.buckets.find((bucket) => bucket.key === 'director')?.count).toBe(1)
    expect(overview.companies.distinctCompanyCount).toBe(1)
  })

  it('should describe an empty community without crashing', () => {
    const overview = buildOverview({ members: [], leads: [], asOf })

    expect(overview.memberCount).toBe(0)
    expect(overview.gender.total).toBe(0)
    expect(overview.position.buckets).toEqual([])
  })
})
