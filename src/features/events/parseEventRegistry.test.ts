import { describe, expect, it } from 'vitest'
import { EVENTS_HEADINGS } from './eventRegistryTabs'
import { parseEvents } from './parseEventRegistry'

const HEADER_ROW = [...EVENTS_HEADINGS]

const eventRow = ({
  id,
  name = 'Autumn Hiring Mixer',
  date = '2026-09-24',
  host = 'Fennimore Labs',
  location = 'Fennimore Labs, Tel Aviv',
  membersOnly = 'Yes',
  closedOut = 'No',
  archived = 'No',
}: {
  id: string
  name?: string
  date?: string
  host?: string
  location?: string
  membersOnly?: string
  closedOut?: string
  archived?: string
}): string[] => [id, name, date, host, location, '', membersOnly, closedOut, archived, '']

describe('parseEvents', () => {
  it('should read an event and where its row is', () => {
    const { events } = parseEvents({
      rows: [HEADER_ROW, eventRow({ id: 'evt-1-aaaa', name: 'Pride Panel', date: '2026-06-24' })],
    })

    expect(events).toEqual([
      {
        rowNumber: 2,
        id: 'evt-1-aaaa',
        name: 'Pride Panel',
        date: '2026-06-24',
        host: 'Fennimore Labs',
        location: 'Fennimore Labs, Tel Aviv',
        isMembersOnly: true,
        isClosedOut: false,
        isArchived: false,
      },
    ])
  })

  it('should keep an event id attached to its event when the rows are reordered', () => {
    const inOneOrder = parseEvents({
      rows: [HEADER_ROW, eventRow({ id: 'evt-a', name: 'First' }), eventRow({ id: 'evt-b', name: 'Second' })],
    })
    const reordered = parseEvents({
      rows: [HEADER_ROW, eventRow({ id: 'evt-b', name: 'Second' }), eventRow({ id: 'evt-a', name: 'First' })],
    })

    const nameById = (parsed: ReturnType<typeof parseEvents>): Record<string, string> =>
      Object.fromEntries(parsed.events.map((event) => [event.id, event.name]))

    expect(nameById(reordered)).toEqual(nameById(inOneOrder))
    expect(reordered.events.map((event) => event.rowNumber)).toEqual([2, 3])
  })

  it('should read an event with no host as an event no company is hosting', () => {
    const { events } = parseEvents({ rows: [HEADER_ROW, eventRow({ id: 'evt-1', host: '' })] })

    expect(events[0]?.host).toBe(undefined)
  })

  it('should read the door policy, the close-out and the archive flags', () => {
    const { events } = parseEvents({
      rows: [
        HEADER_ROW,
        eventRow({ id: 'evt-1', membersOnly: 'No', closedOut: 'Yes', archived: 'Yes' }),
      ],
    })

    expect(events[0]).toMatchObject({
      isMembersOnly: false,
      isClosedOut: true,
      isArchived: true,
    })
  })

  it('should keep an archived event, because its attendance is counted from it', () => {
    const { events } = parseEvents({
      rows: [HEADER_ROW, eventRow({ id: 'evt-1', archived: 'Yes' })],
    })

    expect(events).toHaveLength(1)
  })

  it('should skip a spacer row rather than report it as an event that lost its id', () => {
    const { events, issues } = parseEvents({ rows: [HEADER_ROW, [], ['', '  ']] })

    expect(events).toEqual([])
    expect(issues).toEqual([])
  })

  it('should find its columns wherever the organiser moved them to', () => {
    const { events } = parseEvents({
      rows: [
        ['Name', 'Event ID', 'Date', 'Location', 'Members only', 'Closed out', 'Archived', 'Host'],
        ['Pride Panel', 'evt-1', '2026-06-24', 'Quillon Cloud', 'Yes', 'No', 'No', 'Quillon Cloud'],
      ],
    })

    expect(events[0]).toMatchObject({ id: 'evt-1', name: 'Pride Panel' })
  })
})

describe('parseEvents, where a row cannot be trusted', () => {
  it('should report an event with no id rather than list one nothing can point at', () => {
    const { events, issues } = parseEvents({
      rows: [HEADER_ROW, eventRow({ id: '', name: 'Nameless row' })],
    })

    expect(events).toEqual([])
    expect(issues).toEqual([{ kind: 'no-id', rowNumber: 2, name: 'Nameless row' }])
  })

  it('should still list an event whose date was typed in some other shape, and say so', () => {
    const { events, issues } = parseEvents({
      rows: [HEADER_ROW, eventRow({ id: 'evt-1', date: '16.4.25' })],
    })

    expect(events).toHaveLength(1)
    expect(issues).toEqual([{ kind: 'unreadable-date', rowNumber: 2, recordedDate: '16.4.25' }])
  })

  it('should report a missing date the same way, since the listing splits on it', () => {
    const { issues } = parseEvents({ rows: [HEADER_ROW, eventRow({ id: 'evt-1', date: '' })] })

    expect(issues).toEqual([{ kind: 'unreadable-date', rowNumber: 2, recordedDate: '' }])
  })
})

describe('parseEvents, where the tab itself is wrong', () => {
  it('should refuse a tab with no header row rather than report a community with no events', () => {
    expect(() => parseEvents({ rows: [] })).toThrow(/Events tab/)
  })

  it('should name the heading a tab is missing', () => {
    expect(() => parseEvents({ rows: [['Name', 'Date', 'Location']] })).toThrow(/Event ID/)
  })
})
