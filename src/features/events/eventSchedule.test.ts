import { describe, expect, it } from 'vitest'
import { buildEvent } from '../../testing/eventFactory'
import { groupEventsForListing, selectListedEvents, splitEventsByDate } from './eventSchedule'

const TODAY = '2026-09-19'

const namesOf = (events: readonly { name: string }[]): readonly string[] =>
  events.map((event) => event.name)

describe('splitEventsByDate', () => {
  it('should put an event dated after today among the upcoming events', () => {
    const events = [buildEvent({ id: 'a', name: 'Autumn Mixer', date: '2026-10-15' })]

    const split = splitEventsByDate({ events, today: TODAY })

    expect(namesOf(split.upcomingEvents)).toEqual(['Autumn Mixer'])
    expect(split.pastEvents).toEqual([])
  })

  it('should put an event dated before today among the past events', () => {
    const events = [buildEvent({ id: 'a', name: 'Summer Social', date: '2026-08-01' })]

    const split = splitEventsByDate({ events, today: TODAY })

    expect(namesOf(split.pastEvents)).toEqual(['Summer Social'])
    expect(split.upcomingEvents).toEqual([])
  })

  it("should treat today's event as upcoming, because its door has not opened yet", () => {
    const events = [buildEvent({ id: 'a', name: 'Tonight', date: TODAY })]

    const split = splitEventsByDate({ events, today: TODAY })

    expect(namesOf(split.upcomingEvents)).toEqual(['Tonight'])
  })

  it('should order upcoming events soonest first', () => {
    const events = [
      buildEvent({ id: 'a', name: 'Later', date: '2026-12-01' }),
      buildEvent({ id: 'b', name: 'Sooner', date: '2026-09-24' }),
      buildEvent({ id: 'c', name: 'Middle', date: '2026-10-15' }),
    ]

    const split = splitEventsByDate({ events, today: TODAY })

    expect(namesOf(split.upcomingEvents)).toEqual(['Sooner', 'Middle', 'Later'])
  })

  it('should order past events most recent first', () => {
    const events = [
      buildEvent({ id: 'a', name: 'Oldest', date: '2025-05-14' }),
      buildEvent({ id: 'b', name: 'Newest', date: '2026-06-24' }),
      buildEvent({ id: 'c', name: 'Middle', date: '2025-09-03' }),
    ]

    const split = splitEventsByDate({ events, today: TODAY })

    expect(namesOf(split.pastEvents)).toEqual(['Newest', 'Middle', 'Oldest'])
  })

  it('should leave the events it was given untouched', () => {
    const events = [
      buildEvent({ id: 'a', date: '2026-12-01' }),
      buildEvent({ id: 'b', date: '2025-01-01' }),
    ]

    splitEventsByDate({ events, today: TODAY })

    expect(events.map((event) => event.id)).toEqual(['a', 'b'])
  })
})

describe('selectListedEvents', () => {
  it('should leave out an archived event', () => {
    const events = [
      buildEvent({ id: 'a', name: 'Live' }),
      buildEvent({ id: 'b', name: 'Archived', isArchived: true }),
    ]

    expect(namesOf(selectListedEvents(events))).toEqual(['Live'])
  })
})

describe('groupEventsForListing', () => {
  it('should keep an archived event out of both lists while it still exists', () => {
    const events = [
      buildEvent({ id: 'a', name: 'Archived past', date: '2025-05-14', isArchived: true }),
      buildEvent({ id: 'b', name: 'Archived upcoming', date: '2026-12-01', isArchived: true }),
      buildEvent({ id: 'c', name: 'Listed', date: '2026-12-02' }),
    ]

    const grouped = groupEventsForListing({ events, today: TODAY })

    expect(namesOf(grouped.upcomingEvents)).toEqual(['Listed'])
    expect(grouped.pastEvents).toEqual([])
    expect(events).toHaveLength(3)
  })
})
