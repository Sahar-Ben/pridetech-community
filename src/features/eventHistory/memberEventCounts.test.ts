import { describe, expect, it } from 'vitest'
import { countEventsByMember, doesEventCountMatch } from './memberEventCounts'
import { buildEvent, buildRegistrant } from '../../testing/eventFactory'
import { buildMember } from '../../testing/memberFactory'

const TODAY = '2026-09-26'

const nadav = buildMember({ rowNumber: 2, name: 'Nadav Pedazur', mail: 'npedazur@gmail.com' })
const dana = buildMember({ rowNumber: 3, name: 'Dana Sorkin', mail: 'dana@example.com' })
const noa = buildMember({ rowNumber: 4, name: 'Noa Levi', mail: 'noa@example.com' })
const members = [nadav, dana, noa]

const play = buildEvent({ id: 'play', name: 'PrideTech Play', date: '2026-09-16' })
const tiktok = buildEvent({ id: 'tiktok', name: 'TikTok', date: '2026-06-08', isClosedOut: true })
const upcoming = buildEvent({ id: 'upcoming', name: 'Moabet', date: '2026-11-14' })

const count = (registrants: Parameters<typeof buildRegistrant>[0][]) =>
  countEventsByMember({
    members,
    history: {
      events: [play, tiktok, upcoming],
      registrants: registrants.map((overrides, index) =>
        buildRegistrant({ id: `r${index}`, ...overrides }),
      ),
      unreadSheets: [],
    },
    today: TODAY,
  })

describe('countEventsByMember', () => {
  it('should count every event a member held a place at, past, attended or upcoming', () => {
    const counts = count([
      { eventId: 'play', email: 'npedazur@gmail.com' },
      { eventId: 'tiktok', email: 'npedazur@gmail.com', checkedInAt: '2026-06-08T19:00' },
      { eventId: 'upcoming', email: 'npedazur@gmail.com' },
    ])

    expect(counts.get(nadav.rowNumber)).toBe(3)
  })

  it('should leave a member who registered for nothing out, which reads as none', () => {
    const counts = count([{ eventId: 'play', email: 'npedazur@gmail.com' }])

    expect(counts.get(noa.rowNumber)).toBeUndefined()
  })

  it('should not count a waiting list or a no-show as an event they were part of', () => {
    const counts = count([
      { eventId: 'play', email: 'dana@example.com', registration: 'waitlist' },
      { eventId: 'tiktok', email: 'dana@example.com' },
    ])

    expect(counts.get(dana.rowNumber)).toBeUndefined()
  })

  it('should count one event once, however many times they filled the form in', () => {
    const counts = count([
      { eventId: 'play', email: 'dana@example.com' },
      { eventId: 'play', email: 'DANA@example.com' },
    ])

    expect(counts.get(dana.rowNumber)).toBe(1)
  })

  it('should count a registration made under one of their other emails', () => {
    const withWork = buildMember({ ...noa, otherEmails: ['noa@work.example.com'] })
    const counts = countEventsByMember({
      members: [nadav, dana, withWork],
      history: {
        events: [play],
        registrants: [buildRegistrant({ eventId: 'play', email: 'noa@work.example.com' })],
        unreadSheets: [],
      },
      today: TODAY,
    })

    expect(counts.get(noa.rowNumber)).toBe(1)
  })
})

describe('doesEventCountMatch', () => {
  it.each([
    [0, 'none', true],
    [1, 'none', false],
    [1, 'one', true],
    [2, 'two', true],
    [2, 'three-or-more', false],
    [3, 'three-or-more', true],
    [9, 'three-or-more', true],
    [0, 'any', true],
  ] as const)('should match %i events against the %s filter: %s', (eventCount, filter, expected) => {
    expect(doesEventCountMatch({ count: eventCount, filter })).toBe(expected)
  })
})
