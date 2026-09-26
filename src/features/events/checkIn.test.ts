import { describe, expect, it } from 'vitest'
import { buildRegistrant } from '../../testing/eventFactory'
import { buildMember } from '../../testing/memberFactory'
import { applyAttendance } from './attendanceLog'
import { toWalkInFieldsFromMember } from './checkIn'
import { resolveRegistrantLink } from './registrantLink'

describe('toWalkInFieldsFromMember', () => {
  const dana = buildMember({ rowNumber: 2, name: 'Dana Sorkin', mail: 'dana.sorkin@example.com' })

  it('should carry the member name through to the door list', () => {
    expect(toWalkInFieldsFromMember(dana).name).toBe('Dana Sorkin')
  })

  it('should record a member added at the door as a matched member, not an unmatched walk-in', () => {
    const walkIn = toWalkInFieldsFromMember(dana)
    const [added] = applyAttendance({
      registrants: [],
      entries: [
        {
          eventId: 'event-1',
          email: walkIn.email,
          name: walkIn.name,
          status: 'attended',
          at: '2026-09-24T19:12:00.000Z',
        },
      ],
      eventId: 'event-1',
    })

    expect(added).toBeDefined()
    expect(
      resolveRegistrantLink({
        registrant: added ?? buildRegistrant(),
        members: [dana],
        eventRegistrants: added === undefined ? [] : [added],
      }),
    ).toEqual({ kind: 'member', memberName: 'Dana Sorkin', rowNumber: 2 })
  })
})

