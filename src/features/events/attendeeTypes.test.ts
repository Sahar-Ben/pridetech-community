import { describe, expect, it } from 'vitest'
import {
  ALL_ATTENDEE_TYPES,
  filterByAttendeeType,
  keepAvailableFilter,
  summariseAttendeeTypes,
} from './attendeeTypes'
import { buildRegistrant } from '../../testing/eventFactory'

const SEEKING = 'Looking for a job'
const RECRUITING = 'Recruiting'

const seeker = (id: string, attendeeType: string | undefined = SEEKING) =>
  buildRegistrant({ id, name: id, attendeeType })

const recruiter = (id: string) => buildRegistrant({ id, name: id, attendeeType: RECRUITING })

const unanswered = (id: string) => buildRegistrant({ id, name: id, attendeeType: undefined })

describe('summariseAttendeeTypes', () => {
  it('should count each answer, largest group first', () => {
    const summary = summariseAttendeeTypes([
      recruiter('r1'),
      seeker('s1'),
      seeker('s2'),
    ])

    expect(summary.types.map(({ label, count }) => [label, count])).toEqual([
      [SEEKING, 2],
      [RECRUITING, 1],
    ])
  })

  it('should count two spellings of one answer together, under the first spelling', () => {
    const summary = summariseAttendeeTypes([
      seeker('s1', 'Recruiting '),
      seeker('s2', 'recruiting'),
    ])

    expect(summary.types).toEqual([{ key: 'recruiting', label: 'Recruiting', count: 2 }])
  })

  it('should count the people who did not answer rather than drop them', () => {
    const summary = summariseAttendeeTypes([seeker('s1'), unanswered('s2'), seeker('s3', '  ')])

    expect(summary.unansweredCount).toBe(2)
    expect(summary.types.map(({ count }) => count)).toEqual([1])
  })

  it('should order groups of the same size by name, so every phone shows the same order', () => {
    const summary = summariseAttendeeTypes([recruiter('r1'), seeker('s1')])

    expect(summary.types.map(({ label }) => label)).toEqual([SEEKING, RECRUITING])
  })

  it('should keep a Hebrew answer as it was written', () => {
    const summary = summariseAttendeeTypes([seeker('s1', 'מגייס/ת')])

    expect(summary.types[0]?.label).toBe('מגייס/ת')
  })
})

describe('filterByAttendeeType', () => {
  const registrants = [seeker('s1'), recruiter('r1'), unanswered('n1')]

  it('should show everybody when nothing is chosen', () => {
    expect(filterByAttendeeType({ registrants, filter: ALL_ATTENDEE_TYPES })).toHaveLength(3)
  })

  it('should show only the people who gave the chosen answer', () => {
    const shown = filterByAttendeeType({
      registrants,
      filter: { kind: 'type', key: 'recruiting' },
    })

    expect(shown.map(({ id }) => id)).toEqual(['r1'])
  })

  it('should show the people who did not answer as their own group', () => {
    const shown = filterByAttendeeType({ registrants, filter: { kind: 'unanswered' } })

    expect(shown.map(({ id }) => id)).toEqual(['n1'])
  })
})

describe('keepAvailableFilter', () => {
  it('should fall back to everybody when nobody gives the chosen answer any more', () => {
    const summary = summariseAttendeeTypes([seeker('s1')])

    expect(keepAvailableFilter({ filter: { kind: 'type', key: 'recruiting' }, summary })).toEqual(
      ALL_ATTENDEE_TYPES,
    )
  })

  it('should fall back to everybody when everybody has now answered', () => {
    const summary = summariseAttendeeTypes([seeker('s1')])

    expect(keepAvailableFilter({ filter: { kind: 'unanswered' }, summary })).toEqual(
      ALL_ATTENDEE_TYPES,
    )
  })

  it('should keep a choice that still has people in it', () => {
    const summary = summariseAttendeeTypes([recruiter('r1')])
    const filter = { kind: 'type', key: 'recruiting' } as const

    expect(keepAvailableFilter({ filter, summary })).toBe(filter)
  })
})
