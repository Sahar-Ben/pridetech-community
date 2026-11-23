import { describe, expect, it } from 'vitest'
import {
  checkFirstEventReadiness,
  describeUnreadHistory,
  findFirstTimers,
} from './firstEvent'
import type { EventRegistrantsLoad } from './useEventRegistrants'
import { buildEvent, buildRegistrant } from '../../testing/eventFactory'
import { buildAttachedSheet } from '../../testing/eventsRegistryFactory'
import { buildMember } from '../../testing/memberFactory'

const tonight = buildEvent({ id: 'tonight', name: 'Tonight', date: '2026-11-20' })
const spring = buildEvent({ id: 'spring', name: 'Spring Social', date: '2026-04-01' })
const later = buildEvent({ id: 'later', name: 'Winter Social', date: '2026-12-15' })

const atTonight = (overrides: Parameters<typeof buildRegistrant>[0]) =>
  buildRegistrant({ eventId: 'tonight', ...overrides })

const atSpring = (overrides: Parameters<typeof buildRegistrant>[0]) =>
  buildRegistrant({ eventId: 'spring', ...overrides })

const firstTimersAmong = ({
  registrants,
  events = [tonight, spring],
  members = [],
}: {
  registrants: Parameters<typeof findFirstTimers>[0]['registrants']
  events?: Parameters<typeof findFirstTimers>[0]['events']
  members?: Parameters<typeof findFirstTimers>[0]['members']
}) => [...findFirstTimers({ event: tonight, events, registrants, members })]

describe('findFirstTimers', () => {
  it('should mark everybody at the first event there ever was', () => {
    expect(
      firstTimersAmong({
        events: [tonight],
        registrants: [atTonight({ id: 'a', name: 'Noa Feldman', email: 'noa@example.com' })],
      }),
    ).toEqual(['a'])
  })

  it('should not mark somebody who registered for an earlier event nobody closed out', () => {
    expect(
      firstTimersAmong({
        registrants: [
          atSpring({ id: 's1', name: 'Noa Feldman', email: 'noa@example.com' }),
          atTonight({ id: 'a', name: 'Noa Feldman', email: 'noa@example.com' }),
          atTonight({ id: 'b', name: 'Dana Shani', email: 'dana@example.com' }),
        ],
      }),
    ).toEqual(['b'])
  })

  it('should know the same address however it was typed', () => {
    expect(
      firstTimersAmong({
        registrants: [
          atSpring({ id: 's1', name: 'N. Feldman', email: ' Noa@Example.com ' }),
          atTonight({ id: 'a', name: 'Noa Feldman', email: 'noa@example.com' }),
        ],
      }),
    ).toEqual([])
  })

  it('should know a member who registered with another of their addresses', () => {
    const noa = buildMember({ rowNumber: 7, name: 'Noa Feldman', mail: 'noa@work.example.com', otherEmails: ['noa@home.example.com'] })

    expect(
      firstTimersAmong({
        members: [noa],
        registrants: [
          atSpring({ id: 's1', name: 'Noa F', email: 'noa@home.example.com' }),
          atTonight({ id: 'a', name: 'Noa Feldman', email: 'noa@work.example.com' }),
        ],
      }),
    ).toEqual([])
  })

  it('should know somebody from a sheet that never asked for an email, by full name', () => {
    expect(
      firstTimersAmong({
        registrants: [
          atSpring({ id: 's1', name: 'noa  feldman', email: undefined }),
          atTonight({ id: 'a', name: 'Noa Feldman', email: 'noa@example.com' }),
        ],
      }),
    ).toEqual([])
  })

  it('should not take a first name alone as the same person', () => {
    expect(
      firstTimersAmong({
        registrants: [
          atSpring({ id: 's1', name: 'Noa', email: undefined }),
          atTonight({ id: 'a', name: 'Noa', email: 'noa@example.com' }),
        ],
      }),
    ).toEqual(['a'])
  })

  it('should mark somebody whose only earlier visit was a no-show at an event that was closed out', () => {
    expect(
      firstTimersAmong({
        events: [tonight, { ...spring, isClosedOut: true }],
        registrants: [
          atSpring({ id: 's1', name: 'Noa Feldman', email: 'noa@example.com' }),
          atTonight({ id: 'a', name: 'Noa Feldman', email: 'noa@example.com' }),
        ],
      }),
    ).toEqual(['a'])
  })

  it('should not mark somebody who was checked in at a closed-out event', () => {
    expect(
      firstTimersAmong({
        events: [tonight, { ...spring, isClosedOut: true }],
        registrants: [
          atSpring({ id: 's1', name: 'Noa Feldman', email: 'noa@example.com', checkedInAt: '2026-04-01T18:00:00Z' }),
          atTonight({ id: 'a', name: 'Noa Feldman', email: 'noa@example.com' }),
        ],
      }),
    ).toEqual([])
  })

  it('should mark somebody who was only ever on a waiting list', () => {
    expect(
      firstTimersAmong({
        registrants: [
          atSpring({ id: 's1', name: 'Noa Feldman', email: 'noa@example.com', registration: 'waitlist' }),
          atTonight({ id: 'a', name: 'Noa Feldman', email: 'noa@example.com' }),
        ],
      }),
    ).toEqual(['a'])
  })

  it('should ignore later events and archived ones', () => {
    expect(
      firstTimersAmong({
        events: [tonight, { ...spring, isArchived: true }, later],
        registrants: [
          atSpring({ id: 's1', name: 'Noa Feldman', email: 'noa@example.com' }),
          buildRegistrant({ id: 'l1', eventId: 'later', name: 'Dana Shani', email: 'dana@example.com' }),
          atTonight({ id: 'a', name: 'Noa Feldman', email: 'noa@example.com' }),
          atTonight({ id: 'b', name: 'Dana Shani', email: 'dana@example.com' }),
        ],
      }),
    ).toEqual(['a', 'b'])
  })

  it('should mark a walk-in added at the door tonight', () => {
    expect(
      firstTimersAmong({
        registrants: [
          atTonight({ id: 'w', name: 'Tal Rimon', email: undefined, isWalkIn: true, checkedInAt: '2026-11-20T19:00:00Z' }),
        ],
      }),
    ).toEqual(['w'])
  })
})

const readLoad = (problemCount = 0): EventRegistrantsLoad => ({
  read: {
    registrants: [],
    repeatedCount: 0,
    rowsWithoutNameOrEmail: [],
    problems: Array.from({ length: problemCount }, () => ({
      kind: 'no-access' as const,
      sheet: buildAttachedSheet(),
    })),
  },
  isReading: false,
  errorMessage: undefined,
})

describe('checkFirstEventReadiness', () => {
  it('should wait until the check-ins have been read', () => {
    expect(
      checkFirstEventReadiness({
        event: tonight,
        events: [tonight, spring],
        loads: new Map([['spring', readLoad()]]),
        hasReadAttendance: false,
      }),
    ).toEqual({ kind: 'reading' })
  })

  it('should wait until every earlier event has been read', () => {
    expect(
      checkFirstEventReadiness({
        event: tonight,
        events: [tonight, spring],
        loads: new Map(),
        hasReadAttendance: true,
      }),
    ).toEqual({ kind: 'reading' })
  })

  it('should be ready once every earlier event has an answer, and count the ones that failed', () => {
    const autumn = buildEvent({ id: 'autumn', date: '2025-10-01' })
    const failed: EventRegistrantsLoad = { read: undefined, isReading: false, errorMessage: 'no' }

    expect(
      checkFirstEventReadiness({
        event: tonight,
        events: [tonight, spring, autumn, later],
        loads: new Map([
          ['spring', readLoad(1)],
          ['autumn', failed],
        ]),
        hasReadAttendance: true,
      }),
    ).toEqual({ kind: 'ready', unreadEventCount: 2 })
  })
})

describe('describeUnreadHistory', () => {
  it('should say nothing when every earlier event was read', () => {
    expect(describeUnreadHistory(0)).toBeUndefined()
  })

  it('should say how many earlier events could not be read', () => {
    expect(describeUnreadHistory(1)).toBe(
      '1 earlier event could not be read, so a First event badge may be wrong.',
    )
    expect(describeUnreadHistory(3)).toBe(
      '3 earlier events could not be read, so a First event badge may be wrong.',
    )
  })
})
