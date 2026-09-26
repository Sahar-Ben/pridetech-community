import { describe, expect, it } from 'vitest'
import type { EventAttendanceSummary } from './eventAttendance'
import { describeAttendanceForEvent, describeAttendanceForListing } from './eventAttendanceText'

const summary = (overrides: Partial<EventAttendanceSummary> = {}): EventAttendanceSummary => ({
  registeredCount: 0,
  checkedInCount: 0,
  waitlistCount: 0,
  expectedCount: 0,
  noShowCount: undefined,
  ...overrides,
})

describe('describeAttendanceForListing', () => {
  const listing = (
    overrides: Partial<EventAttendanceSummary>,
    { isPast = false, isClosedOut = false } = {},
  ) => describeAttendanceForListing({ summary: summary(overrides), isPast, isClosedOut })

  it('should lead with the registration count before anybody has arrived', () => {
    expect(listing({ registeredCount: 120 })).toBe('120 registered')
  })

  it('should mention a waitlist only when there is one', () => {
    expect(listing({ registeredCount: 120 })).not.toMatch(/waitlist/)
    expect(listing({ registeredCount: 120, waitlistCount: 24 })).toMatch(/24 on the waitlist/)
  })

  it('should say how many arrived out of how many were expected once anybody has', () => {
    expect(listing({ registeredCount: 40, expectedCount: 40, checkedInCount: 12 })).toBe(
      '12 of 40 arrived',
    )
  })

  it('should report no-shows for a closed-out event', () => {
    expect(
      listing(
        { registeredCount: 10, expectedCount: 10, checkedInCount: 7, noShowCount: 3 },
        { isClosedOut: true },
      ),
    ).toBe('7 of 10 arrived \u{00b7} 3 no-shows')
  })

  it('should write a single no-show in the singular', () => {
    expect(
      listing(
        { registeredCount: 10, expectedCount: 10, checkedInCount: 9, noShowCount: 1 },
        { isClosedOut: true },
      ),
    ).toMatch(/1 no-show$/)
  })

  it('should say a past event nobody was checked in at never had its attendance recorded', () => {
    expect(listing({ registeredCount: 43 }, { isPast: true })).toBe(
      '43 registered \u{00b7} attendance not recorded',
    )
  })
})

describe('describeAttendanceForEvent', () => {
  it('should always state all three counts, so a zero is visible rather than missing', () => {
    expect(describeAttendanceForEvent(summary({ registeredCount: 3 }))).toBe(
      '3 registered \u{00b7} 0 checked in \u{00b7} 0 on the waitlist',
    )
  })

  it('should add the no-show count once the event has been closed out', () => {
    expect(
      describeAttendanceForEvent(summary({ registeredCount: 3, checkedInCount: 1, noShowCount: 2 })),
    ).toMatch(/2 no-shows$/)
  })
})
