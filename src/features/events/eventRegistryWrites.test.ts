import { describe, expect, it } from 'vitest'
import { buildEventEditWrites, buildNewEventWrites } from './eventRegistryWrites'
import { EVENTS_HEADINGS } from './eventRegistryTabs'
import { buildEvent } from '../../testing/eventFactory'

const HEADER_ROW = [...EVENTS_HEADINGS]

const RECORDED_ROW = [
  'evt-1',
  'Autumn Mixer',
  '2026-09-24',
  'Fennimore Labs',
  'Fennimore Labs, Tel Aviv',
  '80',
  'Yes',
  'No',
  'No',
  'Bring the banner',
]

const recorded = buildEvent({
  rowNumber: 2,
  id: 'evt-1',
  name: 'Autumn Mixer',
  date: '2026-09-24',
  host: 'Fennimore Labs',
  location: 'Fennimore Labs, Tel Aviv',
  isMembersOnly: true,
  isClosedOut: false,
  isArchived: false,
})

const writesFor = (updatedEvent: ReturnType<typeof buildEvent>) =>
  buildEventEditWrites({
    originalEvent: recorded,
    updatedEvent,
    headerRow: HEADER_ROW,
    existingRow: RECORDED_ROW,
  })

describe('buildEventEditWrites', () => {
  it('should write nothing when nothing was changed', () => {
    expect(writesFor(recorded)).toEqual([])
  })

  it('should write only the cell that changed', () => {
    expect(writesFor({ ...recorded, name: 'Autumn Hiring Mixer' })).toEqual([
      { target: 'name', value: 'Autumn Hiring Mixer' },
    ])
  })

  it('should write each of several changed cells and nothing beside them', () => {
    expect(writesFor({ ...recorded, date: '2026-10-01', location: 'Wharf 6, Tel Aviv' })).toEqual([
      { target: 'date', value: '2026-10-01' },
      { target: 'location', value: 'Wharf 6, Tel Aviv' },
    ])
  })

  it('should clear a host that was removed rather than leave the old company on the row', () => {
    expect(writesFor({ ...recorded, host: undefined })).toEqual([{ target: 'host', value: '' }])
  })

  it('should never write the event id, which is what attendance points at', () => {
    const writes = buildEventEditWrites({
      originalEvent: recorded,
      updatedEvent: { ...recorded, id: 'evt-2', name: 'Renamed' },
      headerRow: HEADER_ROW,
      existingRow: RECORDED_ROW,
    })

    expect(writes.map((write) => write.target)).toEqual(['name'])
  })

  it('should never write the capacity or the notes this app does not read', () => {
    const writes = writesFor({ ...recorded, name: 'Renamed' })

    expect(writes.map((write) => write.target)).not.toContain('capacity')
    expect(writes).toHaveLength(1)
  })

  it('should write a flag that was turned on', () => {
    expect(writesFor({ ...recorded, isArchived: true })).toEqual([
      { target: 'isArchived', value: 'Yes' },
    ])
  })

  it('should write a flag that was turned off', () => {
    expect(writesFor({ ...recorded, isMembersOnly: false })).toEqual([
      { target: 'isMembersOnly', value: 'No' },
    ])
  })

  it('should not rewrite a flag another organiser has already set the same way', () => {
    expect(
      buildEventEditWrites({
        originalEvent: recorded,
        updatedEvent: { ...recorded, isArchived: true },
        headerRow: HEADER_ROW,
        existingRow: [...RECORDED_ROW.slice(0, 8), 'Yes', RECORDED_ROW[9] ?? ''],
      }),
    ).toEqual([])
  })

  it('should not rewrite a blank flag cell as No, which would touch every untouched row', () => {
    expect(
      buildEventEditWrites({
        originalEvent: { ...recorded, isClosedOut: true },
        updatedEvent: { ...recorded, isClosedOut: false },
        headerRow: HEADER_ROW,
        existingRow: [...RECORDED_ROW.slice(0, 7), '', ...RECORDED_ROW.slice(8)],
      }),
    ).toEqual([])
  })

  it('should not rewrite a text cell another organiser has already changed the same way', () => {
    expect(
      buildEventEditWrites({
        originalEvent: recorded,
        updatedEvent: { ...recorded, name: 'Autumn Hiring Mixer' },
        headerRow: HEADER_ROW,
        existingRow: ['evt-1', 'Autumn Hiring Mixer', ...RECORDED_ROW.slice(2)],
      }),
    ).toEqual([])
  })
})

describe('buildNewEventWrites', () => {
  it('should write every field of a new event, including the flags that are not set', () => {
    expect(
      buildNewEventWrites({
        event: {
          id: 'evt-9',
          name: 'Board Games Night',
          date: '2026-10-15',
          host: undefined,
          location: 'Pell and Quarry, Haifa',
          isMembersOnly: false,
          isClosedOut: false,
          isArchived: false,
        },
      }),
    ).toEqual([
      { target: 'id', value: 'evt-9' },
      { target: 'name', value: 'Board Games Night' },
      { target: 'date', value: '2026-10-15' },
      { target: 'host', value: '' },
      { target: 'location', value: 'Pell and Quarry, Haifa' },
      { target: 'isMembersOnly', value: 'No' },
      { target: 'isClosedOut', value: 'No' },
      { target: 'isArchived', value: 'No' },
    ])
  })
})
