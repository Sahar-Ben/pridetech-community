import { describe, expect, it } from 'vitest'
import { describeTokenError } from './tokenErrorMessage'

describe('describeTokenError', () => {
  it('should explain a closed sign-in window in words the reviewer can act on', () => {
    expect(describeTokenError({ type: 'popup_closed', message: undefined })).toMatch(/closed/i)
  })

  it('should tell the user to allow pop-ups when the window never opened', () => {
    expect(describeTokenError({ type: 'popup_failed_to_open', message: undefined })).toMatch(
      /pop-ups/i,
    )
  })

  it('should keep the detail Google gave when the failure is not one we recognise', () => {
    expect(describeTokenError({ type: 'unknown_type', message: 'something odd' })).toBe(
      'Google sign-in failed. unknown_type: something odd',
    )
  })

  it('should still say something when Google gives no detail at all', () => {
    expect(describeTokenError({ type: undefined, message: undefined })).toBe(
      'Google sign-in failed.',
    )
  })
})
