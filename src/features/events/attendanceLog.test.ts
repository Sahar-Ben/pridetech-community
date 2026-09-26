import { describe, expect, it } from 'vitest'
import {
  applyAttendance,
  buildAttendanceRow,
  parseAttendance,
  toAttendanceKey,
  type AttendanceEntry,
} from './attendanceLog'
import { ATTENDANCE_HEADINGS } from './eventRegistryTabs'
import { buildRegistrant } from '../../testing/eventFactory'

const HEADER = [...ATTENDANCE_HEADINGS]

const entry = (overrides: Partial<AttendanceEntry> = {}): AttendanceEntry => ({
  eventId: 'evt-1',
  email: 'dana@example.com',
  name: 'Dana Sorkin',
  status: 'attended',
  at: '2026-10-14T18:00:00.000Z',
  ...overrides,
})

describe('toAttendanceKey', () => {
  it('should know somebody by their email, whatever its case and spacing', () => {
    expect(toAttendanceKey({ email: ' Dana@Example.com ', name: 'Dana' })).toBe(
      'email:dana@example.com',
    )
  })

  it('should fall back to the name when there is no email', () => {
    expect(toAttendanceKey({ email: undefined, name: '  Dana   Sorkin ' })).toBe('name:dana sorkin')
  })
})

describe('parseAttendance', () => {
  it('should read both kinds of row this app writes', () => {
    const rows = [
      HEADER,
      ['evt-1', 'dana@example.com', 'Dana Sorkin', 'Attended', '2026-10-14T18:00:00.000Z', ''],
      ['evt-1', 'dana@example.com', 'Dana Sorkin', 'Check-in undone', '2026-10-14T18:01:00.000Z', ''],
    ]

    expect(parseAttendance({ rows }).map((read) => read.status)).toEqual(['attended', 'undone'])
  })

  it('should skip a row whose status it does not recognise rather than guess', () => {
    const rows = [HEADER, ['evt-1', 'dana@example.com', 'Dana', 'Maybe', '2026-10-14', '']]

    expect(parseAttendance({ rows })).toEqual([])
  })

  it('should find its columns by heading, wherever they sit', () => {
    const rows = [
      ['Status', 'Name', 'Email', 'Event ID', 'Checked in at', 'Guest of'],
      ['Attended', 'Dana Sorkin', 'dana@example.com', 'evt-1', '2026-10-14T18:00:00.000Z', ''],
    ]

    expect(parseAttendance({ rows })).toEqual([entry()])
  })

  it('should refuse a tab that lost a heading it needs', () => {
    expect(() => parseAttendance({ rows: [['Event ID', 'Email', 'Name']] })).toThrow(/status/i)
  })
})

describe('buildAttendanceRow', () => {
  it('should write each value under its heading, with the status spelled for people', () => {
    expect(buildAttendanceRow({ headerRow: HEADER, entry: entry({ status: 'undone' }) })).toEqual([
      'evt-1',
      'dana@example.com',
      'Dana Sorkin',
      'Check-in undone',
      '2026-10-14T18:00:00.000Z',
      '',
    ])
  })
})

describe('applyAttendance', () => {
  const dana = buildRegistrant({ id: 'r1', eventId: 'evt-1', name: 'Dana Sorkin', email: 'DANA@example.com' })
  const noa = buildRegistrant({ id: 'r2', eventId: 'evt-1', name: 'Noa Feldman', email: 'noa@example.com' })

  it('should check in a registrant the log last checked in', () => {
    const people = applyAttendance({ registrants: [dana, noa], entries: [entry()], eventId: 'evt-1' })

    expect(people.map(({ name, checkedInAt }) => ({ name, checkedInAt }))).toEqual([
      { name: 'Dana Sorkin', checkedInAt: '2026-10-14T18:00:00.000Z' },
      { name: 'Noa Feldman', checkedInAt: undefined },
    ])
  })

  it('should take the last word when a check-in was undone', () => {
    const people = applyAttendance({
      registrants: [dana],
      entries: [entry(), entry({ status: 'undone', at: '2026-10-14T18:05:00.000Z' })],
      eventId: 'evt-1',
    })

    expect(people[0]?.checkedInAt).toBe(undefined)
  })

  it('should count two phones checking in the same person once', () => {
    const people = applyAttendance({
      registrants: [dana],
      entries: [entry(), entry({ at: '2026-10-14T18:00:02.000Z' })],
      eventId: 'evt-1',
    })

    expect(people).toHaveLength(1)
  })

  it('should ignore what the log says about other events', () => {
    const people = applyAttendance({
      registrants: [dana],
      entries: [entry({ eventId: 'evt-2' })],
      eventId: 'evt-1',
    })

    expect(people[0]?.checkedInAt).toBe(undefined)
  })

  it('should add somebody checked in who is on no response sheet as a walk-in', () => {
    const people = applyAttendance({
      registrants: [dana],
      entries: [entry({ email: 'avi@example.com', name: 'Avi Levi' })],
      eventId: 'evt-1',
    })

    expect(people[1]).toMatchObject({
      id: 'attendance:email:avi@example.com',
      name: 'Avi Levi',
      isWalkIn: true,
      checkedInAt: '2026-10-14T18:00:00.000Z',
    })
  })

  it('should drop a walk-in whose check-in was undone', () => {
    const people = applyAttendance({
      registrants: [],
      entries: [
        entry({ email: 'avi@example.com', name: 'Avi Levi' }),
        entry({ email: 'avi@example.com', name: 'Avi Levi', status: 'undone' }),
      ],
      eventId: 'evt-1',
    })

    expect(people).toEqual([])
  })
})
