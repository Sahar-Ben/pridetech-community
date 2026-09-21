import { describe, expect, it } from 'vitest'
import { buildRegistrant } from '../../testing/eventFactory'
import { selectEventRegistrants, sortRegistrantsByName } from './eventRegistrants'

describe('selectEventRegistrants', () => {
  it('should return only the rows belonging to that event', () => {
    const registrants = [
      buildRegistrant({ id: 'a', eventId: 'event-1' }),
      buildRegistrant({ id: 'b', eventId: 'event-2' }),
      buildRegistrant({ id: 'c', eventId: 'event-1' }),
    ]

    const selected = selectEventRegistrants({ registrants, eventId: 'event-1' })

    expect(selected.map((registrant) => registrant.id)).toEqual(['a', 'c'])
  })

  it('should return nobody for an event with no response sheet rows', () => {
    expect(selectEventRegistrants({ registrants: [], eventId: 'event-1' })).toEqual([])
  })
})

describe('sortRegistrantsByName', () => {
  it('should order people alphabetically, so a paper-free door can still scan the list', () => {
    const registrants = [
      buildRegistrant({ id: 'a', name: 'Ronit Amsalem' }),
      buildRegistrant({ id: 'b', name: 'Amit Barzel' }),
      buildRegistrant({ id: 'c', name: 'nadav peleg' }),
    ]

    const sorted = sortRegistrantsByName(registrants)

    expect(sorted.map((registrant) => registrant.name)).toEqual([
      'Amit Barzel',
      'nadav peleg',
      'Ronit Amsalem',
    ])
  })

  it('should leave the list it was given in place', () => {
    const registrants = [
      buildRegistrant({ id: 'a', name: 'Ronit Amsalem' }),
      buildRegistrant({ id: 'b', name: 'Amit Barzel' }),
    ]

    sortRegistrantsByName(registrants)

    expect(registrants[0]?.name).toBe('Ronit Amsalem')
  })
})
