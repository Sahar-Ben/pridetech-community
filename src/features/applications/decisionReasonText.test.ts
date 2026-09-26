import { describe, expect, it } from 'vitest'
import { describeReasonPrompt } from './decisionReasonText'

describe('describeReasonPrompt', () => {
  it('should ask why the applicant is being declined', () => {
    expect(describeReasonPrompt({ kind: 'decline', applicantName: 'Dana Maman' })).toBe(
      'Why are you declining Dana Maman?',
    )
  })

  it('should ask why the applicant is being kept for later rather than why they were turned away', () => {
    expect(describeReasonPrompt({ kind: 'maybe', applicantName: 'Dana Maman' })).toBe(
      'Why keep Dana Maman for later?',
    )
  })
})
