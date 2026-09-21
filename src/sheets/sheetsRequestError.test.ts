import { describe, expect, it } from 'vitest'
import { isExpiredSessionError, isForbiddenError, SheetsRequestError } from './sheetsRequestError'

const errorWithStatus = (status: number): SheetsRequestError =>
  new SheetsRequestError({ range: 'Members!A1:Z', status, detail: 'nope' })

describe('isForbiddenError', () => {
  it('should recognise the refusal Google sends when the grant does not cover the file', () => {
    expect(isForbiddenError(errorWithStatus(403))).toBe(true)
  })

  it('should not mistake an expired session for a permission problem', () => {
    expect(isForbiddenError(errorWithStatus(401))).toBe(false)
  })

  it('should not mistake a plain error for a permission problem', () => {
    expect(isForbiddenError(new Error('403'))).toBe(false)
  })
})

describe('isExpiredSessionError', () => {
  it('should not mistake a permission refusal for an expired session', () => {
    expect(isExpiredSessionError(errorWithStatus(403))).toBe(false)
  })
})
