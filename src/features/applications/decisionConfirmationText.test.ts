import { describe, expect, it } from 'vitest'
import { describeConfirmedDecision } from './decisionConfirmationText'

describe('describeConfirmedDecision', () => {
  it('should say an approved applicant is now a member', () => {
    expect(describeConfirmedDecision({ kind: 'approve', applicantName: 'Dana Maman' })).toBe(
      'Dana Maman was approved and added to Members.',
    )
  })

  it('should say which list a declined applicant is now on', () => {
    expect(describeConfirmedDecision({ kind: 'decline', applicantName: 'Dana Maman' })).toBe(
      'Dana Maman was declined. They are on the Declined list.',
    )
  })

  it('should say which list an applicant kept for later is now on', () => {
    expect(describeConfirmedDecision({ kind: 'maybe', applicantName: 'Dana Maman' })).toBe(
      'Dana Maman was kept for later. They are on the Maybe list.',
    )
  })
})
