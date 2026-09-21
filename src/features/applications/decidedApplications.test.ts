import { describe, expect, it } from 'vitest'
import { withoutDecidedApplications } from './decidedApplications'
import type { Lead } from './lead'
import { buildLeadsReviewFixture } from '../../testing/leadsReviewFactory'

const lead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 2,
  timestamp: '3/8/2025 14:25:20',
  name: 'Dana Maman',
  jobTitle: 'Founder',
  company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana',
  email: 'dana@example.com',
  phone: '050',
  city: 'Tel Aviv',
  interests: 'AI',
  status: 'pending',
  ...overrides,
})

const reviewOfTwo = () =>
  buildLeadsReviewFixture({
    leads: [lead(), lead({ rowNumber: 3, name: 'Noa Feldman', email: 'noa@example.com' })],
  })

describe('withoutDecidedApplications', () => {
  it('should drop an application that has just been decided', () => {
    const review = withoutDecidedApplications({
      review: reviewOfTwo(),
      decidedRowNumbers: new Set([2]),
    })

    expect(review.waitingApplications.map((waiting) => waiting.lead.name)).toEqual(['Noa Feldman'])
  })

  it('should count down as applications are decided', () => {
    const review = withoutDecidedApplications({
      review: reviewOfTwo(),
      decidedRowNumbers: new Set([2]),
    })

    expect(review.counts.waitingCount).toBe(1)
  })

  it('should leave the review untouched when nothing has been decided', () => {
    const original = reviewOfTwo()

    expect(withoutDecidedApplications({ review: original, decidedRowNumbers: new Set() })).toBe(
      original,
    )
  })

  it('should leave every other count alone, since only the queue shrank', () => {
    const original = buildLeadsReviewFixture({
      leads: [lead(), lead({ rowNumber: 3, email: 'dana@example.com' })],
      rowsWithoutEmail: [{ rowNumber: 9, name: undefined }],
    })

    const review = withoutDecidedApplications({ review: original, decidedRowNumbers: new Set([2]) })

    expect(review.counts.repeatedLeadEmailCount).toBe(original.counts.repeatedLeadEmailCount)
    expect(review.counts.leadsWithoutEmailCount).toBe(original.counts.leadsWithoutEmailCount)
  })
})
