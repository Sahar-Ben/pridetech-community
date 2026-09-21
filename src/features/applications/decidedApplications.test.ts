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

describe('withoutDecidedApplications, for an application approved from the declined list', () => {
  const reviewOfOneDeclined = () =>
    buildLeadsReviewFixture({
      leads: [
        lead({ rowNumber: 2, status: 'declined' }),
        lead({ rowNumber: 3, name: 'Noa Feldman', email: 'noa@example.com', status: 'declined' }),
      ],
    })

  it('should drop the application that has just been approved', () => {
    const review = withoutDecidedApplications({
      review: reviewOfOneDeclined(),
      decidedRowNumbers: new Set([2]),
    })

    expect(review.declinedApplications.map((declined) => declined.lead.name)).toEqual([
      'Noa Feldman',
    ])
  })

  it('should count down as declined applications are approved', () => {
    const review = withoutDecidedApplications({
      review: reviewOfOneDeclined(),
      decidedRowNumbers: new Set([2]),
    })

    expect(review.counts.declinedCount).toBe(1)
  })
})

describe('withoutDecidedApplications, from the maybe list', () => {
  const reviewWithMaybe = () =>
    buildLeadsReviewFixture({
      leads: [
        lead(),
        lead({ rowNumber: 3, name: 'Come Back Later', email: 'later@example.com', status: 'maybe' }),
      ],
    })

  it('should drop an application decided out of the maybe list', () => {
    const review = withoutDecidedApplications({
      review: reviewWithMaybe(),
      decidedRowNumbers: new Set([3]),
    })

    expect(review.maybeApplications).toEqual([])
  })

  it('should count down the maybe list as its applications are decided', () => {
    const review = withoutDecidedApplications({
      review: reviewWithMaybe(),
      decidedRowNumbers: new Set([3]),
    })

    expect(review.counts.maybeCount).toBe(0)
  })
})
