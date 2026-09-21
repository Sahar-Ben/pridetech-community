import { describe, expect, it } from 'vitest'
import { formatApprovalDate } from './approvalDate'

describe('formatApprovalDate', () => {
  it('should write the date the way the Approved at column already reads', () => {
    expect(formatApprovalDate(new Date(2026, 8, 21, 14, 30))).toBe('2026-09-21')
  })

  it('should pad a single-digit month and day, so the column stays sortable as text', () => {
    expect(formatApprovalDate(new Date(2026, 0, 5, 9, 0))).toBe('2026-01-05')
  })

  it('should use the reviewer own day rather than the UTC one, late in the evening', () => {
    expect(formatApprovalDate(new Date(2026, 8, 21, 23, 59))).toBe('2026-09-21')
  })

  it('should use the reviewer own day rather than the UTC one, early in the morning', () => {
    expect(formatApprovalDate(new Date(2026, 8, 21, 0, 30))).toBe('2026-09-21')
  })
})
