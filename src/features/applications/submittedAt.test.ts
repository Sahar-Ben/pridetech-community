import { describe, expect, it } from 'vitest'
import { describeSubmittedAt, isOverAMonthOld } from './submittedAt'

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

describe('isOverAMonthOld', () => {
  const asOf = new Date(2026, 9, 23, 15, 0)

  it('should flag an application sent more than a month ago', () => {
    expect(isOverAMonthOld({ timestamp: '9/22/2026 23:59:00', asOf })).toBe(true)
  })

  it('should not flag one sent exactly a month ago', () => {
    expect(isOverAMonthOld({ timestamp: '9/23/2026 08:00:00', asOf })).toBe(false)
  })

  it('should not flag one sent this week', () => {
    expect(isOverAMonthOld({ timestamp: '10/20/2026 10:00:00', asOf })).toBe(false)
  })

  it('should count back to the end of a shorter month', () => {
    const endOfMarch = new Date(2026, 2, 31)

    expect(isOverAMonthOld({ timestamp: '2/28/2026 10:00:00', asOf: endOfMarch })).toBe(false)
    expect(isOverAMonthOld({ timestamp: '2/27/2026 10:00:00', asOf: endOfMarch })).toBe(true)
  })

  it('should never flag a cell that is not a date', () => {
    expect(isOverAMonthOld({ timestamp: 'sometime in spring', asOf })).toBe(false)
    expect(isOverAMonthOld({ timestamp: undefined, asOf })).toBe(false)
  })
})
