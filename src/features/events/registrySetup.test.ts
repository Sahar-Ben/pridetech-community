import { describe, expect, it, vi } from 'vitest'
import {
  ATTENDANCE_HEADINGS,
  ATTENDANCE_TAB_NAME,
  EVENTS_HEADINGS,
  EVENTS_TAB_NAME,
  EVENT_SHEETS_HEADINGS,
  EVENT_SHEETS_TAB_NAME,
} from './eventRegistryTabs'
import { applyRegistrySetup, readRegistrySetupPlan } from './registrySetup'
import { createFakeSheet, type FakeSheet } from '../../testing/fakeSheet'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'

const MEMBERS_TAB = { Members: [['Name', 'Mail']] }

const EVERY_TAB_EMPTY = {
  ...MEMBERS_TAB,
  [EVENTS_TAB_NAME]: [],
  [EVENT_SHEETS_TAB_NAME]: [],
  [ATTENDANCE_TAB_NAME]: [],
}

const setUp = async (sheet: FakeSheet): Promise<void> => {
  const plans = await readRegistrySetupPlan({ sheetsClient: sheet.client })
  await applyRegistrySetup({ sheetsClient: sheet.client, plans })
}

describe('readRegistrySetupPlan', () => {
  it('should find every registry tab absent in a spreadsheet that has never held one', async () => {
    const sheet = createFakeSheet({ tabs: MEMBERS_TAB })

    expect(await readRegistrySetupPlan({ sheetsClient: sheet.client })).toEqual([
      { tabName: EVENTS_TAB_NAME, state: 'absent' },
      { tabName: EVENT_SHEETS_TAB_NAME, state: 'absent' },
      { tabName: ATTENDANCE_TAB_NAME, state: 'absent' },
    ])
  })

  it('should not read a tab that is not there, which Google answers with an error', async () => {
    const readRanges: string[] = []
    const sheet = createFakeSheet({
      tabs: { ...MEMBERS_TAB, [EVENTS_TAB_NAME]: [] },
      onRead: (range) => readRanges.push(range),
    })

    await readRegistrySetupPlan({ sheetsClient: sheet.client })

    expect(readRanges).toEqual(['Events!A1:Z'])
  })

  it('should find the tabs the organiser made by hand and left empty', async () => {
    const sheet = createFakeSheet({ tabs: EVERY_TAB_EMPTY })

    expect(await readRegistrySetupPlan({ sheetsClient: sheet.client })).toEqual([
      { tabName: EVENTS_TAB_NAME, state: 'empty' },
      { tabName: EVENT_SHEETS_TAB_NAME, state: 'empty' },
      { tabName: ATTENDANCE_TAB_NAME, state: 'empty' },
    ])
  })
})

describe('applyRegistrySetup, where no registry tab is there', () => {
  it('should create the three tabs the app needs', async () => {
    const sheet = createFakeSheet({ tabs: MEMBERS_TAB })

    await setUp(sheet)

    expect(sheet.tabNames()).toEqual([
      'Members',
      EVENTS_TAB_NAME,
      EVENT_SHEETS_TAB_NAME,
      ATTENDANCE_TAB_NAME,
    ])
  })

  it('should write the heading row of each created tab', async () => {
    const sheet = createFakeSheet({ tabs: MEMBERS_TAB })

    await setUp(sheet)

    expect(sheet.rowsOf(EVENTS_TAB_NAME)[0]).toEqual([...EVENTS_HEADINGS])
    expect(sheet.rowsOf(EVENT_SHEETS_TAB_NAME)[0]).toEqual([...EVENT_SHEETS_HEADINGS])
    expect(sheet.rowsOf(ATTENDANCE_TAB_NAME)[0]).toEqual([...ATTENDANCE_HEADINGS])
  })

  it('should write the headings exactly as spelled, never re-read by the spreadsheet', async () => {
    const sheet = createFakeSheet({ tabs: MEMBERS_TAB })

    await setUp(sheet)

    expect(sheet.writes.every((write) => write.valueInputOption === 'RAW')).toBe(true)
  })

  it('should leave the tabs that were already there alone', async () => {
    const sheet = createFakeSheet({ tabs: MEMBERS_TAB })

    await setUp(sheet)

    expect(sheet.rowsOf('Members')).toEqual([['Name', 'Mail']])
  })
})

describe('applyRegistrySetup, where the organiser made the tabs by hand and left them empty', () => {
  it('should not try to create a tab that is already there', async () => {
    const sheet = createFakeSheet({ tabs: EVERY_TAB_EMPTY })

    await setUp(sheet)

    expect(sheet.client.addTabs).not.toHaveBeenCalled()
  })

  it('should write the heading row the hand-made tabs never got', async () => {
    const sheet = createFakeSheet({ tabs: EVERY_TAB_EMPTY })

    await setUp(sheet)

    expect(sheet.rowsOf(EVENTS_TAB_NAME)[0]).toEqual([...EVENTS_HEADINGS])
  })

  it('should write headings over a row of blank cells, which is not something somebody typed', async () => {
    const sheet = createFakeSheet({
      tabs: { ...EVERY_TAB_EMPTY, [EVENTS_TAB_NAME]: [['', '  ', '']] },
    })

    await setUp(sheet)

    expect(sheet.rowsOf(EVENTS_TAB_NAME)[0]).toEqual([...EVENTS_HEADINGS])
  })
})

describe('applyRegistrySetup, where a tab already holds work', () => {
  const guestList = {
    ...MEMBERS_TAB,
    [EVENTS_TAB_NAME]: [['Event', 'When'], ['Opening night', '16.4.25']],
    [EVENT_SHEETS_TAB_NAME]: [],
    [ATTENDANCE_TAB_NAME]: [],
  }

  it('should refuse the whole setup rather than write into a tab holding something else', async () => {
    const sheet = createFakeSheet({ tabs: guestList })
    const plans = await readRegistrySetupPlan({ sheetsClient: sheet.client })

    await expect(applyRegistrySetup({ sheetsClient: sheet.client, plans })).rejects.toThrow(
      /Event ID/,
    )
  })

  it('should leave every cell of that tab exactly as it was', async () => {
    const sheet = createFakeSheet({ tabs: guestList })
    const plans = await readRegistrySetupPlan({ sheetsClient: sheet.client })

    await applyRegistrySetup({ sheetsClient: sheet.client, plans }).catch(() => undefined)

    expect(sheet.rowsOf(EVENTS_TAB_NAME)).toEqual([
      ['Event', 'When'],
      ['Opening night', '16.4.25'],
    ])
    expect(sheet.writes).toEqual([])
  })

  it('should leave the other tabs alone too, rather than set up half a registry', async () => {
    const sheet = createFakeSheet({ tabs: guestList })
    const plans = await readRegistrySetupPlan({ sheetsClient: sheet.client })

    await applyRegistrySetup({ sheetsClient: sheet.client, plans }).catch(() => undefined)

    expect(sheet.rowsOf(EVENT_SHEETS_TAB_NAME)).toEqual([])
  })
})

describe('applyRegistrySetup, where there is nothing left to do', () => {
  it('should write nothing when every tab is already set up', async () => {
    const sheet = createFakeSheet({
      tabs: {
        ...MEMBERS_TAB,
        [EVENTS_TAB_NAME]: [[...EVENTS_HEADINGS]],
        [EVENT_SHEETS_TAB_NAME]: [[...EVENT_SHEETS_HEADINGS]],
        [ATTENDANCE_TAB_NAME]: [[...ATTENDANCE_HEADINGS]],
      },
    })

    await setUp(sheet)

    expect(sheet.writes).toEqual([])
    expect(sheet.client.addTabs).not.toHaveBeenCalled()
  })
})

describe('applyRegistrySetup, where Google refuses', () => {
  it('should say the refusal was about adding tabs and how the grant is fixed', async () => {
    const sheet = createFakeSheet({ tabs: MEMBERS_TAB })
    const plans = await readRegistrySetupPlan({ sheetsClient: sheet.client })
    sheet.client.addTabs = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({ range: 'the new tabs', status: 403, detail: 'lacks permission' }),
      )

    await expect(applyRegistrySetup({ sheetsClient: sheet.client, plans })).rejects.toThrow(
      /Google Picker/,
    )
  })

  it('should say no tab was added when the refusal came before anything was written', async () => {
    const sheet = createFakeSheet({ tabs: MEMBERS_TAB })
    const plans = await readRegistrySetupPlan({ sheetsClient: sheet.client })
    sheet.client.addTabs = vi
      .fn()
      .mockRejectedValue(
        new SheetsRequestError({ range: 'the new tabs', status: 403, detail: 'lacks permission' }),
      )

    await expect(applyRegistrySetup({ sheetsClient: sheet.client, plans })).rejects.toThrow(
      /nothing was added/i,
    )
  })

  it('should pass an expired session through so the organiser is signed back in', async () => {
    const sheet = createFakeSheet({ tabs: MEMBERS_TAB })
    const plans = await readRegistrySetupPlan({ sheetsClient: sheet.client })
    const expired = new SheetsRequestError({ range: 'the new tabs', status: 401, detail: 'nope' })
    sheet.client.addTabs = vi.fn().mockRejectedValue(expired)

    await expect(applyRegistrySetup({ sheetsClient: sheet.client, plans })).rejects.toBe(expired)
  })
})
