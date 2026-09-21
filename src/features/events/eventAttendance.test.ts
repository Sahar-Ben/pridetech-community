import { describe, expect, it } from 'vitest'
import { buildRegistrant } from '../../testing/eventFactory'
import { deriveRegistrantStatus, summariseEventAttendance } from './eventAttendance'

const CHECK_IN_TIME = '2026-09-24T19:12:00.000Z'

describe('deriveRegistrantStatus', () => {
  it('should report someone who has been checked in as attended', () => {
    const registrant = buildRegistrant({ checkedInAt: CHECK_IN_TIME })

    expect(deriveRegistrantStatus({ registrant, isClosedOut: false })).toBe('attended')
  })

  it('should report someone who has not arrived at a running event as registered', () => {
    expect(deriveRegistrantStatus({ registrant: buildRegistrant(), isClosedOut: false })).toBe(
      'registered',
    )
  })

  it('should never call someone a no-show while the event is still running', () => {
    const everyone = [
      buildRegistrant({ id: 'a' }),
      buildRegistrant({ id: 'b', registration: 'waitlist' }),
    ]

    const statuses = everyone.map((registrant) =>
      deriveRegistrantStatus({ registrant, isClosedOut: false }),
    )

    expect(statuses).not.toContain('no-show')
  })

  it('should report someone who never arrived at a closed-out event as a no-show', () => {
    expect(deriveRegistrantStatus({ registrant: buildRegistrant(), isClosedOut: true })).toBe(
      'no-show',
    )
  })

  it('should leave a waitlisted person on the waitlist rather than calling them a no-show', () => {
    const registrant = buildRegistrant({ registration: 'waitlist' })

    expect(deriveRegistrantStatus({ registrant, isClosedOut: true })).toBe('waitlist')
  })

  it('should report a waitlisted person who got in at the door as attended', () => {
    const registrant = buildRegistrant({ registration: 'waitlist', checkedInAt: CHECK_IN_TIME })

    expect(deriveRegistrantStatus({ registrant, isClosedOut: true })).toBe('attended')
  })
})

describe('summariseEventAttendance', () => {
  const registrants = [
    buildRegistrant({ id: 'a', checkedInAt: CHECK_IN_TIME }),
    buildRegistrant({ id: 'b' }),
    buildRegistrant({ id: 'c' }),
    buildRegistrant({ id: 'd', registration: 'waitlist' }),
    buildRegistrant({ id: 'e', registration: 'waitlist', checkedInAt: CHECK_IN_TIME }),
    buildRegistrant({ id: 'f', isWalkIn: true, checkedInAt: CHECK_IN_TIME }),
  ]

  it('should count everyone holding a place, leaving the waitlist out', () => {
    const summary = summariseEventAttendance({ registrants, isClosedOut: false })

    expect(summary.registeredCount).toBe(4)
  })

  it('should count everyone who has been checked in, including walk-ins', () => {
    const summary = summariseEventAttendance({ registrants, isClosedOut: false })

    expect(summary.checkedInCount).toBe(3)
  })

  it('should expect everyone holding a place plus the waitlisted people let in', () => {
    const summary = summariseEventAttendance({ registrants, isClosedOut: false })

    expect(summary.expectedCount).toBe(5)
  })

  it('should never expect fewer people than have already been checked in', () => {
    const waitlistOnly = [
      buildRegistrant({ id: 'a', registration: 'waitlist', checkedInAt: CHECK_IN_TIME }),
      buildRegistrant({ id: 'b', registration: 'waitlist' }),
    ]

    const summary = summariseEventAttendance({ registrants: waitlistOnly, isClosedOut: false })

    expect(summary.expectedCount).toBeGreaterThanOrEqual(summary.checkedInCount)
  })

  it('should count the waitlist separately', () => {
    const summary = summariseEventAttendance({ registrants, isClosedOut: false })

    expect(summary.waitlistCount).toBe(2)
  })

  it('should withhold a no-show count while the event is still running', () => {
    const summary = summariseEventAttendance({ registrants, isClosedOut: false })

    expect(summary.noShowCount).toBeUndefined()
  })

  it('should count no-shows once the event has been closed out', () => {
    const summary = summariseEventAttendance({ registrants, isClosedOut: true })

    expect(summary.noShowCount).toBe(2)
  })

  it('should report an event nobody registered for as empty rather than failing', () => {
    const summary = summariseEventAttendance({ registrants: [], isClosedOut: true })

    expect(summary).toEqual({
      registeredCount: 0,
      checkedInCount: 0,
      waitlistCount: 0,
      expectedCount: 0,
      noShowCount: 0,
    })
  })
})
