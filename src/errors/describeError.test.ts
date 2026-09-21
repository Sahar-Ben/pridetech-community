import { describe, expect, it } from 'vitest'
import { describeError } from './describeError'

describe('describeError', () => {
  it('should use the error message when there is one', () => {
    expect(describeError({ error: new Error('Range not found'), fallback: 'Something broke' })).toBe(
      'Range not found',
    )
  })

  it('should fall back when the thrown value is not an error', () => {
    expect(describeError({ error: 'plain string', fallback: 'Something broke' })).toBe(
      'Something broke',
    )
  })

  it('should fall back when the error carries a blank message', () => {
    expect(describeError({ error: new Error('   '), fallback: 'Something broke' })).toBe(
      'Something broke',
    )
  })
})
