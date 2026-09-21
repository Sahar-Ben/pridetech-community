import { describe, expect, it } from 'vitest'
import { formatEventDate, toIsoDateString } from './eventDate'

describe('formatEventDate', () => {
  it('should spell the month out, so 10-09 is never read as the tenth of September', () => {
    expect(formatEventDate('2026-09-24')).toBe('24 Sep 2026')
  })

  it('should drop the leading zero from the day', () => {
    expect(formatEventDate('2026-10-05')).toBe('5 Oct 2026')
  })

  it('should show a date it cannot read as it was stored rather than as nonsense', () => {
    expect(formatEventDate('not a date')).toBe('not a date')
  })
})

describe('toIsoDateString', () => {
  it('should read the calendar day the organiser is standing in, not the UTC one', () => {
    expect(toIsoDateString(new Date(2026, 8, 19, 23, 30))).toBe('2026-09-19')
  })

  it('should pad a single-digit month and day', () => {
    expect(toIsoDateString(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
