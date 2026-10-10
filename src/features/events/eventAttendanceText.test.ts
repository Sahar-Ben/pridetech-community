import { describe, expect, it } from 'vitest'
import type { EventAttendanceSummary } from './eventAttendance'
import {
  describeAttendanceForEvent,
  describeAttendanceForListing,
  describeCloseOutConsequences,
} from './eventAttendanceText'

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

describe('describeCloseOutConsequences', () => {
  it('should count who becomes attended and who becomes a no-show', () => {
    expect(describeCloseOutConsequences({ checkedInCount: 12, noShowCount: 3 })).toEqual([
      '12 people checked in will be recorded as attended.',
      '3 people who registered but were not checked in will be recorded as no-shows.',
      'Check-in closes for this event. You can reopen it from this page if somebody was missed.',
    ])
  })

  it('should speak of one person as a person', () => {
    expect(describeCloseOutConsequences({ checkedInCount: 1, noShowCount: 1 }).slice(0, 2)).toEqual([
      '1 person checked in will be recorded as attended.',
      '1 person who registered but was not checked in will be recorded as a no-show.',
    ])
  })

  it('should say plainly when nobody was checked in and nobody is missing', () => {
    expect(describeCloseOutConsequences({ checkedInCount: 0, noShowCount: 0 }).slice(0, 2)).toEqual([
      'Nobody was checked in, so nobody will be recorded as attended.',
      'Nobody who registered is still missing, so there will be no no-shows.',
    ])
  })
})
