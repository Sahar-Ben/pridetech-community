import { describe, expect, it } from 'vitest'
import { groupSubmissionsByApplicant } from './leadSubmissions'
import { buildLead } from '../../testing/leadFactory'

const pending = (overrides: Parameters<typeof buildLead>[0]) =>
  buildLead({ status: 'pending', ...overrides })

describe('groupSubmissionsByApplicant', () => {
  it('should give somebody who applied once a count of one and no earlier decision', () => {
    const [applicant] = groupSubmissionsByApplicant([pending({ rowNumber: 2 })])

    expect(applicant).toEqual({
      lead: expect.objectContaining({ rowNumber: 2 }),
      submissionCount: 1,
      earlierDecision: undefined,
    })
  })

  it('should show the newest submission by its timestamp, wherever it sits in the sheet', () => {
    const applicants = groupSubmissionsByApplicant([
      pending({ rowNumber: 2, timestamp: '6/2/2025 10:00:00', jobTitle: 'Head of Data' }),
      pending({ rowNumber: 9, timestamp: '1/2/2025 10:00:00', jobTitle: 'Analyst' }),
    ])

    expect(applicants).toEqual([
      expect.objectContaining({
        lead: expect.objectContaining({ rowNumber: 2, jobTitle: 'Head of Data' }),
        submissionCount: 2,
      }),
    ])
  })

  it('should take the lower row when two submissions share a day', () => {
    const [applicant] = groupSubmissionsByApplicant([
      pending({ rowNumber: 2 }),
      pending({ rowNumber: 9 }),
    ])

    expect(applicant?.lead.rowNumber).toBe(9)
  })

  it('should keep different addresses apart', () => {
    const applicants = groupSubmissionsByApplicant([
      pending({ rowNumber: 2, email: 'dana@example.com' }),
      pending({ rowNumber: 3, email: 'noa@example.com' }),
    ])

    expect(applicants.map(({ submissionCount }) => submissionCount)).toEqual([1, 1])
  })

  it('should carry the newest decision on an older submission', () => {
    const [applicant] = groupSubmissionsByApplicant([
      pending({ rowNumber: 2, timestamp: '1/1/2024 10:00:00', status: 'approved' }),
      pending({ rowNumber: 3, timestamp: '1/1/2025 10:00:00', status: 'declined' }),
      pending({ rowNumber: 4, timestamp: '1/1/2026 10:00:00' }),
    ])

    expect(applicant).toEqual(
      expect.objectContaining({ submissionCount: 3, earlierDecision: 'declined' }),
    )
  })

  it('should count a row marked Duplicate but never show it', () => {
    const [applicant] = groupSubmissionsByApplicant([
      pending({ rowNumber: 2, timestamp: '1/2/2025 10:00:00', status: 'maybe' }),
      pending({ rowNumber: 9, timestamp: '6/2/2025 10:00:00', status: 'duplicate' }),
    ])

    expect(applicant).toEqual({
      lead: expect.objectContaining({ rowNumber: 2, status: 'maybe' }),
      submissionCount: 2,
      earlierDecision: undefined,
    })
  })

  it('should still list somebody whose every row is marked Duplicate, under that status', () => {
    const [applicant] = groupSubmissionsByApplicant([
      pending({ rowNumber: 2, status: 'duplicate' }),
      pending({ rowNumber: 9, status: 'duplicate' }),
    ])

    expect(applicant?.lead.status).toBe('duplicate')
  })
})
