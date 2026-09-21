import { describe, expect, it } from 'vitest'
import { describeDecisionFailure } from './decisionFailureText'
import type { Lead } from './lead'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'

const lead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 3,
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

describe('describeDecisionFailure', () => {
  it('should name the applicant and the decision that failed', () => {
    const message = describeDecisionFailure({
      decision: 'approve',
      lead: lead(),
      error: new Error('quota exceeded'),
    })

    expect(message).toMatch(/approving dana maman/i)
    expect(message).toContain('quota exceeded')
  })

  it('should name a decline as a decline', () => {
    expect(
      describeDecisionFailure({ decision: 'decline', lead: lead(), error: new Error('nope') }),
    ).toMatch(/declining dana maman/i)
  })

  it('should name keeping somebody for later as its own decision', () => {
    expect(
      describeDecisionFailure({ decision: 'maybe', lead: lead(), error: new Error('nope') }),
    ).toMatch(/keeping dana maman for later/i)
  })

  it('should fall back to the email when the application carries no name', () => {
    expect(
      describeDecisionFailure({
        decision: 'approve',
        lead: lead({ name: undefined }),
        error: new Error('nope'),
      }),
    ).toContain('dana@example.com')
  })

  it('should explain a refusal as the grant not covering this file, not as a failed request', () => {
    const message = describeDecisionFailure({
      decision: 'approve',
      lead: lead(),
      error: new SheetsRequestError({
        range: 'Members!A:Z',
        status: 403,
        detail: 'The caller does not have permission',
      }),
    })

    expect(message).toMatch(/pick/i)
    expect(message).toMatch(/permission to change/i)
    expect(message).not.toMatch(/request .*failed/i)
  })

  it('should keep the wording Google sent for any other refusal', () => {
    const message = describeDecisionFailure({
      decision: 'approve',
      lead: lead(),
      error: new SheetsRequestError({ range: 'Members!A:Z', status: 500, detail: 'Backend error' }),
    })

    expect(message).toContain('Backend error')
  })

  it('should still say something useful when the failure carries no message', () => {
    expect(
      describeDecisionFailure({ decision: 'approve', lead: lead(), error: undefined }),
    ).toMatch(/google gave no detail/i)
  })
})
