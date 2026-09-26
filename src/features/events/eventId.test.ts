import { describe, expect, it } from 'vitest'
import { buildEventId, isEventIdShape } from './eventId'

const atInstant = (randomValue: number): string =>
  buildEventId({ now: new Date('2026-09-22T09:15:00.000Z'), randomValue })

describe('buildEventId', () => {
  it('should give two events created in the same millisecond different ids', () => {
    expect(atInstant(0.1)).not.toBe(atInstant(0.9))
  })

  it('should give a later event a different id from an earlier one', () => {
    const earlier = buildEventId({ now: new Date('2026-09-22T09:15:00.000Z'), randomValue: 0.5 })
    const later = buildEventId({ now: new Date('2026-09-22T09:15:01.000Z'), randomValue: 0.5 })

    expect(earlier).not.toBe(later)
  })

  it('should sort by the moment the event was created, so the tab reads in the order it grew', () => {
    const earlier = buildEventId({ now: new Date('2026-09-22T09:15:00.000Z'), randomValue: 0.9 })
    const later = buildEventId({ now: new Date('2026-09-22T09:15:01.000Z'), randomValue: 0.1 })

    expect(earlier < later).toBe(true)
  })

  it('should build an id a spreadsheet cell cannot re-read as anything else', () => {
    const id = atInstant(0.42)

    expect(id).toMatch(/^evt-[0-9a-z]+-[0-9a-z]{4}$/)
  })

  it('should stay inside its shape at both ends of the random range', () => {
    expect(isEventIdShape(atInstant(0))).toBe(true)
    expect(isEventIdShape(atInstant(0.999_999_999))).toBe(true)
  })
})

describe('isEventIdShape', () => {
  it('should recognise an id this app generated', () => {
    expect(isEventIdShape(atInstant(0.3))).toBe(true)
  })

  it('should not recognise a name somebody typed into the Event ID column', () => {
    expect(isEventIdShape('Opening Meetup')).toBe(false)
  })
})
