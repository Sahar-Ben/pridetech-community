import { describe, expect, it } from 'vitest'
import { buildEvent } from '../../testing/eventFactory'
import { appendEvent, archiveEvent, replaceEvent } from './eventUpdates'

describe('replaceEvent', () => {
  it('should swap in the edited event and leave the others alone', () => {
    const events = [buildEvent({ id: 'a', name: 'Before' }), buildEvent({ id: 'b', name: 'Other' })]

    const updated = replaceEvent({
      events,
      updatedEvent: buildEvent({ id: 'a', name: 'After' }),
    })

    expect(updated.map((event) => event.name)).toEqual(['After', 'Other'])
  })
})

describe('appendEvent', () => {
  it('should add the new event to the end, leaving ordering to the listing', () => {
    const events = [buildEvent({ id: 'a' })]

    const updated = appendEvent({ events, newEvent: buildEvent({ id: 'b', name: 'New' }) })

    expect(updated.map((event) => event.id)).toEqual(['a', 'b'])
  })
})

describe('archiveEvent', () => {
  it('should mark the event archived', () => {
    const events = [buildEvent({ id: 'a' })]

    const updated = archiveEvent({ events, eventId: 'a' })

    expect(updated[0]?.isArchived).toBe(true)
  })

  it('should keep the archived event, because deleting it would erase its attendance', () => {
    const events = [buildEvent({ id: 'a', name: 'Summer Social' })]

    const updated = archiveEvent({ events, eventId: 'a' })

    expect(updated).toHaveLength(1)
    expect(updated[0]?.name).toBe('Summer Social')
  })

  it('should not change the list it was given', () => {
    const events = [buildEvent({ id: 'a' })]

    archiveEvent({ events, eventId: 'a' })

    expect(events[0]?.isArchived).toBe(false)
  })
})
