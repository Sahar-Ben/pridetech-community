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
  it('should lead with the registration count, which is what a row is scanned for', () => {
    expect(describeAttendanceForListing(summary({ registeredCount: 120 }))).toBe('120 registered')
  })

  it('should mention a waitlist only when there is one', () => {
    expect(describeAttendanceForListing(summary({ registeredCount: 120 }))).not.toMatch(/waitlist/)
    expect(describeAttendanceForListing(summary({ registeredCount: 120, waitlistCount: 24 }))).toMatch(
      /24 on the waitlist/,
    )
  })

  it('should mention arrivals only once somebody has arrived', () => {
    expect(describeAttendanceForListing(summary({ registeredCount: 10 }))).not.toMatch(/checked in/)
    expect(describeAttendanceForListing(summary({ registeredCount: 10, checkedInCount: 4 }))).toMatch(
      /4 checked in/,
    )
  })

  it('should say nothing about no-shows for an event that is still running', () => {
    expect(describeAttendanceForListing(summary({ registeredCount: 10 }))).not.toMatch(/no-show/)
  })

  it('should report no-shows for a closed-out event', () => {
    expect(
      describeAttendanceForListing(summary({ registeredCount: 10, checkedInCount: 7, noShowCount: 3 })),
    ).toMatch(/3 no-shows/)
  })

  it('should write a single no-show in the singular', () => {
    expect(
      describeAttendanceForListing(summary({ registeredCount: 10, checkedInCount: 9, noShowCount: 1 })),
    ).toMatch(/1 no-show\b/)
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
