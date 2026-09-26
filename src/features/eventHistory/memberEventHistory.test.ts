import { describe, expect, it } from 'vitest'
import { buildMemberEventHistory, summariseMemberEvents } from './memberEventHistory'
import { buildEvent, buildRegistrant } from '../../testing/eventFactory'
import { buildMember } from '../../testing/memberFactory'

const TODAY = '2026-09-26'

const nadav = buildMember({ rowNumber: 2, name: 'Nadav Pedazur', mail: 'npedazur@gmail.com' })
const dana = buildMember({ rowNumber: 3, name: 'Dana Sorkin', mail: 'dana@example.com' })
const members = [nadav, dana]

const play = buildEvent({ id: 'play', name: 'PrideTech Play', date: '2026-09-16' })
const tiktok = buildEvent({ id: 'tiktok', name: 'TikTok', date: '2026-06-08' })
const first = buildEvent({ id: 'first', name: '1st Event', date: '2025-04-16' })

const history = (registrants: Parameters<typeof buildRegistrant>[0][], events = [play, tiktok, first]) => ({
  events,
  registrants: registrants.map((overrides, index) => buildRegistrant({ id: `r${index}`, ...overrides })),
  unreadSheets: [],
})

const statusesFor = (built: ReturnType<typeof history>) =>
  buildMemberEventHistory({ member: nadav, members, history: built, today: TODAY }).map(
    ({ event, status }) => [event.name, status],
  )

describe('buildMemberEventHistory', () => {
  it('should list the events a member registered for by email, newest first', () => {
    expect(
      statusesFor(
        history([
          { eventId: 'tiktok', email: 'NPEDAZUR@gmail.com' },
          { eventId: 'play', email: 'npedazur@gmail.com' },
          { eventId: 'play', email: 'dana@example.com' },
        ]),
      ),
    ).toEqual([
      ['PrideTech Play', 'not-recorded'],
      ['TikTok', 'not-recorded'],
    ])
  })

  it('should say attended when the member was checked in', () => {
    expect(
      statusesFor(
        history([{ eventId: 'play', email: 'npedazur@gmail.com', checkedInAt: '2026-09-16T18:00:00Z' }]),
      ),
    ).toEqual([['PrideTech Play', 'attended']])
  })

  it('should say no-show only once the event was closed out', () => {
    expect(
      statusesFor(
        history([{ eventId: 'play', email: 'npedazur@gmail.com' }], [{ ...play, isClosedOut: true }]),
      ),
    ).toEqual([['PrideTech Play', 'no-show']])
  })

  it('should say registered for an event still to come', () => {
    const upcoming = buildEvent({ id: 'moabet', name: 'Moabet', date: '2026-10-14' })

    expect(
      statusesFor(history([{ eventId: 'moabet', email: 'npedazur@gmail.com' }], [upcoming])),
    ).toEqual([['Moabet', 'registered']])
  })

  it('should say waitlist for somebody who never got a place', () => {
    expect(
      statusesFor(history([{ eventId: 'play', email: 'npedazur@gmail.com', registration: 'waitlist' }])),
    ).toEqual([['PrideTech Play', 'waitlist']])
  })

  it('should find the member by full name on a sheet with no email, and say so', () => {
    const built = history([{ eventId: 'first', name: 'nadav  pedazur', email: undefined }])

    expect(
      buildMemberEventHistory({ member: nadav, members, history: built, today: TODAY }),
    ).toEqual([
      expect.objectContaining({ status: 'not-recorded', isMatchedByName: true }),
    ])
  })

  it('should list nothing for a member who never registered', () => {
    expect(statusesFor(history([{ eventId: 'play', email: 'dana@example.com' }]))).toEqual([])
  })
})

describe('summariseMemberEvents', () => {
  it('should count events, attendances and no-shows', () => {
    const entry = (status: 'attended' | 'no-show' | 'not-recorded') => ({
      event: play,
      status,
      isWalkIn: false,
      isMatchedByName: false,
    })

    expect(summariseMemberEvents([entry('attended'), entry('no-show'), entry('not-recorded')])).toEqual({
      eventCount: 3,
      attendedCount: 1,
      noShowCount: 1,
    })
  })
})
