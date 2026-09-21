import { describe, expect, it } from 'vitest'
import { buildRegistrant } from '../../testing/eventFactory'
import { buildMember } from '../../testing/memberFactory'
import type { Registrant } from './registrant'
import { addWalkInRegistrant, toWalkInFieldsFromMember, toggleRegistrantCheckIn } from './checkIn'
import { resolveRegistrantLink } from './registrantLink'
import { summariseEventAttendance } from './eventAttendance'

const CHECK_IN_TIME = '2026-09-24T19:12:00.000Z'

const findById = ({
  registrants,
  registrantId,
}: {
  registrants: readonly Registrant[]
  registrantId: string
}): Registrant | undefined => registrants.find((registrant) => registrant.id === registrantId)

describe('toggleRegistrantCheckIn', () => {
  it('should check someone in when they are tapped', () => {
    const registrants = [buildRegistrant({ id: 'a' })]

    const updated = toggleRegistrantCheckIn({
      registrants,
      registrantId: 'a',
      checkedInAt: CHECK_IN_TIME,
    })

    expect(findById({ registrants: updated, registrantId: 'a' })?.checkedInAt).toBe(CHECK_IN_TIME)
  })

  it('should undo the check-in when the same person is tapped again', () => {
    const registrants = [buildRegistrant({ id: 'a', checkedInAt: CHECK_IN_TIME })]

    const updated = toggleRegistrantCheckIn({
      registrants,
      registrantId: 'a',
      checkedInAt: '2026-09-24T19:20:00.000Z',
    })

    expect(findById({ registrants: updated, registrantId: 'a' })?.checkedInAt).toBeUndefined()
  })

  it('should leave everybody else alone', () => {
    const registrants = [buildRegistrant({ id: 'a' }), buildRegistrant({ id: 'b' })]

    const updated = toggleRegistrantCheckIn({
      registrants,
      registrantId: 'a',
      checkedInAt: CHECK_IN_TIME,
    })

    expect(findById({ registrants: updated, registrantId: 'b' })?.checkedInAt).toBeUndefined()
  })

  it('should keep a waitlisted person on the waitlist when they are let in', () => {
    const registrants = [buildRegistrant({ id: 'a', registration: 'waitlist' })]

    const updated = toggleRegistrantCheckIn({
      registrants,
      registrantId: 'a',
      checkedInAt: CHECK_IN_TIME,
    })

    expect(findById({ registrants: updated, registrantId: 'a' })?.registration).toBe('waitlist')
  })

  it('should not change the list it was given', () => {
    const registrants = [buildRegistrant({ id: 'a' })]

    toggleRegistrantCheckIn({ registrants, registrantId: 'a', checkedInAt: CHECK_IN_TIME })

    expect(registrants[0]?.checkedInAt).toBeUndefined()
  })
})

describe('addWalkInRegistrant', () => {
  const walkIn = {
    id: 'walk-in-1',
    eventId: 'event-1',
    name: 'Shai Lavon',
    email: 'shai.lavon@example.com',
    checkedInAt: CHECK_IN_TIME,
  }

  it('should add the walk-in to the list', () => {
    const updated = addWalkInRegistrant({ registrants: [buildRegistrant({ id: 'a' })], walkIn })

    expect(updated.map((registrant) => registrant.name)).toEqual(['Sample Person', 'Shai Lavon'])
  })

  it('should count the walk-in as checked in, because they are standing at the door', () => {
    const updated = addWalkInRegistrant({ registrants: [], walkIn })

    expect(summariseEventAttendance({ registrants: updated, isClosedOut: false })).toMatchObject({
      registeredCount: 1,
      checkedInCount: 1,
    })
  })

  it('should mark the walk-in as one, so nobody reads them back as an RSVP', () => {
    const updated = addWalkInRegistrant({ registrants: [], walkIn })

    expect(updated[0]?.isWalkIn).toBe(true)
  })

  it('should record a walk-in who would not give an email without an empty string', () => {
    const updated = addWalkInRegistrant({ registrants: [], walkIn: { ...walkIn, email: '  ' } })

    expect(updated[0]?.email).toBeUndefined()
  })

  it('should trim the name typed one-handed at the door', () => {
    const updated = addWalkInRegistrant({
      registrants: [],
      walkIn: { ...walkIn, name: '  Shai Lavon ' },
    })

    expect(updated[0]?.name).toBe('Shai Lavon')
  })

  it('should not change the list it was given', () => {
    const registrants = [buildRegistrant({ id: 'a' })]

    addWalkInRegistrant({ registrants, walkIn })

    expect(registrants).toHaveLength(1)
  })
})

describe('toWalkInFieldsFromMember', () => {
  const dana = buildMember({ rowNumber: 2, name: 'Dana Sorkin', mail: 'dana.sorkin@example.com' })

  it('should carry the member name through to the door list', () => {
    expect(toWalkInFieldsFromMember(dana).name).toBe('Dana Sorkin')
  })

  it('should record a member added at the door as a matched member, not an unmatched walk-in', () => {
    const added = addWalkInRegistrant({
      registrants: [],
      walkIn: { id: 'w1', eventId: 'event-1', checkedInAt: CHECK_IN_TIME, ...toWalkInFieldsFromMember(dana) },
    })

    expect(
      resolveRegistrantLink({
        registrant: added[0] ?? buildRegistrant(),
        members: [dana],
        eventRegistrants: added,
      }),
    ).toEqual({ kind: 'member', memberName: 'Dana Sorkin', rowNumber: 2 })
  })
})
