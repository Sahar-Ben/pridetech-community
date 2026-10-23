import { describe, expect, it } from 'vitest'
import { describeSubmittedAt } from './submittedAt'

describe('describeSubmittedAt', () => {
  it('should spell the month out and keep the time to the minute', () => {
    expect(describeSubmittedAt('3/8/2025 14:25:20')).toEqual({
      label: '8 Mar 2025, 14:25',
      dateTime: '2025-03-08T14:25',
    })
  })

  it('should pad a morning hour', () => {
    expect(describeSubmittedAt('10/23/2026 9:05:00')?.label).toBe('23 Oct 2026, 09:05')
  })

  it('should show the day alone when the cell has no time', () => {
    expect(describeSubmittedAt('10/23/2026')).toEqual({
      label: '23 Oct 2026',
      dateTime: '2026-10-23',
    })
  })

  it('should read an ISO stamp too', () => {
    expect(describeSubmittedAt('2026-10-23T18:40:00')?.label).toBe('23 Oct 2026, 18:40')
  })

  it('should show a cell that is not a date as typed', () => {
    expect(describeSubmittedAt('  last week ')).toEqual({ label: 'last week', dateTime: undefined })
  })

  it('should show nothing for a blank cell', () => {
    expect(describeSubmittedAt(undefined)).toBeUndefined()
    expect(describeSubmittedAt('   ')).toBeUndefined()
  })
})
