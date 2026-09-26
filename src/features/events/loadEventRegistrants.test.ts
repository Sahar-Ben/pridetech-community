import { describe, expect, it, vi } from 'vitest'
import { loadEventRegistrants } from './loadEventRegistrants'
import { SheetsRequestError } from '../../sheets/sheetsRequestError'
import {
  buildAttachedSheet,
  createFakeResponseSheetAccess,
} from '../../testing/eventsRegistryFactory'

const HEADER = ['Timestamp', 'Name', 'Email', 'Company']

const mainSheet = buildAttachedSheet({ spreadsheetId: 'main-1', role: 'main' })
const waitingList = buildAttachedSheet({ spreadsheetId: 'wait-1', role: 'waiting list' })

const accessWithRows = (rowsBySpreadsheet: Readonly<Record<string, readonly string[][]>>) =>
  createFakeResponseSheetAccess({
    readRows: vi.fn(async ({ spreadsheetId }: { spreadsheetId: string }) => {
      const rows = rowsBySpreadsheet[spreadsheetId]
      if (rows === undefined) {
        throw new SheetsRequestError({ range: 'A1:Z', status: 403, detail: 'denied' })
      }
      return await Promise.resolve([HEADER, ...rows])
    }),
  })

describe('loadEventRegistrants', () => {
  it('should read every sheet attached to the event', async () => {
    const access = accessWithRows({
      'main-1': [['', 'Dana Sorkin', 'dana@example.com', '']],
      'wait-1': [['', 'Noa Feldman', 'noa@example.com', '']],
    })

    const read = await loadEventRegistrants({ access, sheets: [waitingList, mainSheet] })

    expect(read.registrants.map(({ name, registration }) => ({ name, registration }))).toEqual([
      { name: 'Dana Sorkin', registration: 'registered' },
      { name: 'Noa Feldman', registration: 'waitlist' },
    ])
    expect(read.problems).toEqual([])
  })

  it('should keep somebody on the main list when they are also on the waiting list', async () => {
    const access = accessWithRows({
      'main-1': [['', 'Dana Sorkin', 'dana@example.com', '']],
      'wait-1': [['', 'Dana S', 'DANA@example.com', '']],
    })

    const read = await loadEventRegistrants({ access, sheets: [waitingList, mainSheet] })

    expect(read.registrants.map(({ name }) => name)).toEqual(['Dana Sorkin'])
    expect(read.repeatedCount).toBe(1)
  })

  it('should still show the sheets it could read when one is out of reach', async () => {
    const access = accessWithRows({ 'main-1': [['', 'Dana Sorkin', 'dana@example.com', '']] })

    const read = await loadEventRegistrants({ access, sheets: [mainSheet, waitingList] })

    expect(read.registrants.map(({ name }) => name)).toEqual(['Dana Sorkin'])
    expect(read.problems).toEqual([{ kind: 'no-access', sheet: waitingList }])
  })

  it('should read a missing file as out of reach too, since Google answers that with a 404', async () => {
    const access = createFakeResponseSheetAccess({
      readRows: vi.fn(async () => {
        throw new SheetsRequestError({ range: 'A1:Z', status: 404, detail: 'not found' })
      }),
    })

    const read = await loadEventRegistrants({ access, sheets: [mainSheet] })

    expect(read.problems).toEqual([{ kind: 'no-access', sheet: mainSheet }])
  })

  it('should report any other failure with what Google said', async () => {
    const access = createFakeResponseSheetAccess({
      readRows: vi.fn(async () => {
        throw new Error('Unable to parse range')
      }),
    })

    const read = await loadEventRegistrants({ access, sheets: [mainSheet] })

    expect(read.problems).toEqual([
      { kind: 'read-failed', sheet: mainSheet, message: 'Unable to parse range' },
    ])
  })

  it('should not read a sheet whose column mapping could not be read', async () => {
    const readRows = vi.fn()
    const unreadable = buildAttachedSheet({ mapping: undefined })

    const read = await loadEventRegistrants({
      access: createFakeResponseSheetAccess({ readRows }),
      sheets: [unreadable],
    })

    expect(readRows).not.toHaveBeenCalled()
    expect(read.problems).toEqual([{ kind: 'unreadable-mapping', sheet: unreadable }])
  })

  it('should pass an expired session through so the organiser is signed back in', async () => {
    const access = createFakeResponseSheetAccess({
      readRows: vi.fn(async () => {
        throw new SheetsRequestError({ range: 'A1:Z', status: 401, detail: 'expired' })
      }),
    })

    await expect(loadEventRegistrants({ access, sheets: [mainSheet] })).rejects.toThrow(/401/)
  })

  it('should say which rows on which sheet had neither a name nor an email', async () => {
    const access = accessWithRows({ 'main-1': [['9/1/2026', '', '', 'Playtika']] })

    const read = await loadEventRegistrants({ access, sheets: [mainSheet] })

    expect(read.rowsWithoutNameOrEmail).toEqual([{ sheet: mainSheet, rowNumbers: [2] }])
  })
})
