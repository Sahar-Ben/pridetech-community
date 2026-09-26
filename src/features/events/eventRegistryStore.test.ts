import { describe, expect, it } from 'vitest'
import { addEventToRegistry } from './addEventToRegistry'
import { attachResponseSheet } from './attachResponseSheet'
import {
  ATTENDANCE_HEADINGS,
  ATTENDANCE_TAB_NAME,
  EVENTS_HEADINGS,
  EVENTS_TAB_NAME,
  EVENT_SHEETS_HEADINGS,
  EVENT_SHEETS_TAB_NAME,
} from './eventRegistryTabs'
import { loadEventRegistry } from './loadEventRegistry'
import { saveEventToRegistry } from './saveEventToRegistry'
import { buildEvent } from '../../testing/eventFactory'
import { createFakeSheet, type FakeSheet } from '../../testing/fakeSheet'

const EVENT_ROW = [
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

const autumnMixer = buildEvent({
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

const registrySheet = ({
  eventRows = [EVENT_ROW],
  attachedRows = [],
}: {
  eventRows?: readonly (readonly string[])[]
  attachedRows?: readonly (readonly string[])[]
} = {}): FakeSheet =>
  createFakeSheet({
    tabs: {
      [EVENTS_TAB_NAME]: [[...EVENTS_HEADINGS], ...eventRows],
      [EVENT_SHEETS_TAB_NAME]: [[...EVENT_SHEETS_HEADINGS], ...attachedRows],
      [ATTENDANCE_TAB_NAME]: [[...ATTENDANCE_HEADINGS]],
    },
  })

describe('saveEventToRegistry', () => {
  it('should write only the cells that changed', async () => {
    const sheet = registrySheet()

    await saveEventToRegistry({
      sheetsClient: sheet.client,
      originalEvent: autumnMixer,
      updatedEvent: { ...autumnMixer, name: 'Autumn Hiring Mixer' },
    })

    expect(sheet.writes).toEqual([
      { kind: 'update', range: 'Events!B2', values: ['Autumn Hiring Mixer'], valueInputOption: 'RAW' },
    ])
  })

  it('should leave the capacity and the notes the organiser keeps by hand', async () => {
    const sheet = registrySheet()

    await saveEventToRegistry({
      sheetsClient: sheet.client,
      originalEvent: autumnMixer,
      updatedEvent: { ...autumnMixer, name: 'Autumn Hiring Mixer' },
    })

    expect(sheet.rowsOf(EVENTS_TAB_NAME)[1]).toEqual([
      'evt-1',
      'Autumn Hiring Mixer',
      '2026-09-24',
      'Fennimore Labs',
      'Fennimore Labs, Tel Aviv',
      '80',
      'Yes',
      'No',
      'No',
      'Bring the banner',
    ])
  })

  it('should send a date as typed, never handed to the spreadsheet to re-read', async () => {
    const sheet = registrySheet()

    await saveEventToRegistry({
      sheetsClient: sheet.client,
      originalEvent: autumnMixer,
      updatedEvent: { ...autumnMixer, date: '2026-10-01' },
    })

    expect(sheet.rowsOf(EVENTS_TAB_NAME)[1]?.[2]).toBe('2026-10-01')
    expect(sheet.writes.every((write) => write.valueInputOption === 'RAW')).toBe(true)
  })

  it('should call Google not at all when nothing was changed', async () => {
    const sheet = registrySheet()

    await saveEventToRegistry({
      sheetsClient: sheet.client,
      originalEvent: autumnMixer,
      updatedEvent: autumnMixer,
    })

    expect(sheet.writes).toEqual([])
  })

  it('should archive by setting a flag, never by removing the row', async () => {
    const sheet = registrySheet()

    await saveEventToRegistry({
      sheetsClient: sheet.client,
      originalEvent: autumnMixer,
      updatedEvent: { ...autumnMixer, isArchived: true },
    })

    expect(sheet.rowsOf(EVENTS_TAB_NAME)).toHaveLength(2)
    expect(sheet.rowsOf(EVENTS_TAB_NAME)[1]?.[8]).toBe('Yes')
  })

  it('should refuse to write when the row no longer holds this event', async () => {
    const sheet = registrySheet({ eventRows: [['evt-2', ...EVENT_ROW.slice(1)]] })

    await expect(
      saveEventToRegistry({
        sheetsClient: sheet.client,
        originalEvent: autumnMixer,
        updatedEvent: { ...autumnMixer, name: 'Autumn Hiring Mixer' },
      }),
    ).rejects.toThrow(/row 2 no longer holds/i)
  })

  it('should write nothing at all when the row moved', async () => {
    const sheet = registrySheet({ eventRows: [['evt-2', ...EVENT_ROW.slice(1)]] })

    await saveEventToRegistry({
      sheetsClient: sheet.client,
      originalEvent: autumnMixer,
      updatedEvent: { ...autumnMixer, name: 'Autumn Hiring Mixer' },
    }).catch(() => undefined)

    expect(sheet.writes).toEqual([])
  })

  it('should say the event by name when it refuses, so the organiser knows which one', async () => {
    const sheet = registrySheet({ eventRows: [['evt-2', ...EVENT_ROW.slice(1)]] })

    await expect(
      saveEventToRegistry({
        sheetsClient: sheet.client,
        originalEvent: autumnMixer,
        updatedEvent: { ...autumnMixer, name: 'Renamed' },
      }),
    ).rejects.toThrow(/Autumn Mixer/)
  })
})

describe('addEventToRegistry', () => {
  const boardGames = {
    id: 'evt-9',
    name: 'Board Games Night',
    date: '2026-10-15',
    host: undefined,
    location: 'Pell and Quarry, Haifa',
    isMembersOnly: false,
    isClosedOut: false,
    isArchived: false,
  }

  it('should append a row carrying the id the app generated', async () => {
    const sheet = registrySheet()

    await addEventToRegistry({ sheetsClient: sheet.client, event: boardGames })

    expect(sheet.rowsOf(EVENTS_TAB_NAME)[2]).toEqual([
      'evt-9',
      'Board Games Night',
      '2026-10-15',
      '',
      'Pell and Quarry, Haifa',
      '',
      'No',
      'No',
      'No',
      '',
    ])
  })

  it('should leave the capacity and notes of a new event blank rather than invent them', async () => {
    const sheet = registrySheet()

    await addEventToRegistry({ sheetsClient: sheet.client, event: boardGames })

    const appended = sheet.rowsOf(EVENTS_TAB_NAME)[2] ?? []
    expect(appended).toHaveLength(EVENTS_HEADINGS.length)
    expect([appended[5], appended[9]]).toEqual(['', ''])
  })

  it('should append as typed, so a date stays the day it names', async () => {
    const sheet = registrySheet()

    await addEventToRegistry({ sheetsClient: sheet.client, event: boardGames })

    expect(sheet.writes.map((write) => write.valueInputOption)).toEqual(['RAW'])
  })

  it('should refuse an id the tab already holds rather than split one event across two rows', async () => {
    const sheet = registrySheet()

    await expect(
      addEventToRegistry({ sheetsClient: sheet.client, event: { ...boardGames, id: 'evt-1' } }),
    ).rejects.toThrow(/evt-1/)
  })

  it('should refuse a tab with no header row to append under', async () => {
    const sheet = createFakeSheet({ tabs: { [EVENTS_TAB_NAME]: [] } })

    await expect(
      addEventToRegistry({ sheetsClient: sheet.client, event: boardGames }),
    ).rejects.toThrow(/header row/i)
  })
})

describe('attachResponseSheet', () => {
  const attachment = {
    eventId: 'evt-1',
    spreadsheetId: 'response-sheet-1',
    sheetName: 'Form Responses 1',
    role: 'main' as const,
    mapping: { timestamp: 0, name: 1, email: 2 },
  }

  it('should append the sheet, its role and its column mapping', async () => {
    const sheet = registrySheet()

    await attachResponseSheet({ sheetsClient: sheet.client, attachment })

    expect(sheet.rowsOf(EVENT_SHEETS_TAB_NAME)[1]).toEqual([
      'evt-1',
      'response-sheet-1',
      'Form Responses 1',
      'main',
      '{"timestamp":"A","name":"B","email":"C","company":null,"jobTitle":null}',
    ])
  })

  it('should record a sheet with no email column, which is a real state and not a fault', async () => {
    const sheet = registrySheet()

    await attachResponseSheet({
      sheetsClient: sheet.client,
      attachment: { ...attachment, mapping: { name: 1 } },
    })

    expect(sheet.rowsOf(EVENT_SHEETS_TAB_NAME)[1]?.[4]).toContain('"email":null')
  })

  it('should let one event carry a main sheet and a waiting list kept somewhere else', async () => {
    const sheet = registrySheet()

    await attachResponseSheet({ sheetsClient: sheet.client, attachment })
    await attachResponseSheet({
      sheetsClient: sheet.client,
      attachment: {
        ...attachment,
        spreadsheetId: 'waiting-list-sheet',
        sheetName: 'Sheet1',
        role: 'waiting list',
      },
    })

    expect(sheet.rowsOf(EVENT_SHEETS_TAB_NAME).slice(1).map((row) => row[3])).toEqual([
      'main',
      'waiting list',
    ])
  })

  it('should send the mapping as typed, so the spreadsheet cannot re-read the braces', async () => {
    const sheet = registrySheet()

    await attachResponseSheet({ sheetsClient: sheet.client, attachment })

    expect(sheet.writes.map((write) => write.valueInputOption)).toEqual(['RAW'])
  })
})

describe('loadEventRegistry', () => {
  it('should read the events and the sheets attached to them together', async () => {
    const sheet = registrySheet({
      attachedRows: [['evt-1', 'response-sheet-1', 'Form Responses 1', 'main', '{}']],
    })

    const registry = await loadEventRegistry({ sheetsClient: sheet.client })

    expect(registry.events.map((event) => event.id)).toEqual(['evt-1'])
    expect(registry.attachedSheets.map((attached) => attached.sheetName)).toEqual([
      'Form Responses 1',
    ])
  })

  it('should hand back the rows it could not read rather than drop them quietly', async () => {
    const sheet = registrySheet({ eventRows: [EVENT_ROW, ['', 'Nameless']] })

    const registry = await loadEventRegistry({ sheetsClient: sheet.client })

    expect(registry.eventIssues).toEqual([{ kind: 'no-id', rowNumber: 3, name: 'Nameless' }])
  })

  it('should name the tab that could not be read', async () => {
    const sheet = createFakeSheet({ tabs: { [EVENTS_TAB_NAME]: [[...EVENTS_HEADINGS]] } })

    await expect(loadEventRegistry({ sheetsClient: sheet.client })).rejects.toThrow(
      /Event sheets/,
    )
  })

  it('should read an empty registry as a community with no events yet', async () => {
    const sheet = registrySheet({ eventRows: [] })

    const registry = await loadEventRegistry({ sheetsClient: sheet.client })

    expect(registry.events).toEqual([])
    expect(registry.eventIssues).toEqual([])
  })
})
