import { describe, expect, it, vi } from 'vitest'
import { createResponseSheetAccess } from './createResponseSheetAccess'
import { createFakeSpreadsheetPicker } from '../testing/googlePortFactory'
import type { PickSpreadsheet } from '../picker/spreadsheetPicker'
import type { CreateSheetsClient } from '../sheets/sheetsClient'

const createClient: CreateSheetsClient = ({ spreadsheetId }) => ({
  spreadsheetId,
  readRange: vi.fn(async ({ range }: { range: string }) =>
    await Promise.resolve(range.startsWith("'Form Responses 1'") ? [['Timestamp', 'Name']] : []),
  ),
  appendRow: vi.fn(),
  updateCell: vi.fn(),
  updateCells: vi.fn(),
  readTabNames: vi.fn(async () => await Promise.resolve(['Form Responses 1', 'Sheet2'])),
  addTabs: vi.fn(),
})

const buildAccess = (pickSpreadsheet: PickSpreadsheet) =>
  createResponseSheetAccess({ pickSpreadsheet, accessToken: 'token-1', createClient })

describe('createResponseSheetAccess, picking', () => {
  it('should hand back the file the organiser picked', async () => {
    const access = buildAccess(
      createFakeSpreadsheetPicker([{ spreadsheetId: 'responses-1', name: 'Playtika (9.9.26)' }]),
    )

    expect(await access.pickSpreadsheet()).toEqual({
      spreadsheetId: 'responses-1',
      name: 'Playtika (9.9.26)',
    })
  })

  it('should answer with nothing when the organiser closed the picker without choosing', async () => {
    const access = buildAccess(createFakeSpreadsheetPicker([]))

    expect(await access.pickSpreadsheet()).toBe(undefined)
  })

  it('should reject when the picker itself could not be opened', async () => {
    const access = buildAccess(({ onError }) => {
      onError('Google Picker has not loaded yet.')
    })

    await expect(access.pickSpreadsheet()).rejects.toThrow(/picker has not loaded/i)
  })
})

describe('createResponseSheetAccess, reading the picked file', () => {
  it('should list the tabs of the picked spreadsheet', async () => {
    const access = buildAccess(createFakeSpreadsheetPicker(['responses-1']))

    expect(await access.readTabNames({ spreadsheetId: 'responses-1' })).toEqual([
      'Form Responses 1',
      'Sheet2',
    ])
  })

  it('should read the header row of a tab whose name needs quoting in a range', async () => {
    const access = buildAccess(createFakeSpreadsheetPicker(['responses-1']))

    expect(
      await access.readHeaderRow({
        spreadsheetId: 'responses-1',
        sheetName: 'Form Responses 1',
      }),
    ).toEqual(['Timestamp', 'Name'])
  })

  it('should read an empty header row as a sheet with no columns rather than throw', async () => {
    const access = buildAccess(createFakeSpreadsheetPicker(['responses-1']))

    expect(
      await access.readHeaderRow({ spreadsheetId: 'responses-1', sheetName: 'Sheet2' }),
    ).toEqual([])
  })

  it('should read every row of a tab, header included, as far as column Z', async () => {
    const readRange = vi.fn(
      async () =>
        await Promise.resolve([
          ['Timestamp', 'Name'],
          ['9/1/2026 10:00:00', 'Dana Sorkin'],
        ]),
    )
    const access = createResponseSheetAccess({
      pickSpreadsheet: createFakeSpreadsheetPicker(['responses-1']),
      accessToken: 'token-1',
      createClient: (options) => ({ ...createClient(options), readRange }),
    })

    expect(
      await access.readRows({ spreadsheetId: 'responses-1', sheetName: 'Form Responses 1' }),
    ).toEqual([
      ['Timestamp', 'Name'],
      ['9/1/2026 10:00:00', 'Dana Sorkin'],
    ])
    expect(readRange).toHaveBeenCalledWith({ range: "'Form Responses 1'!A1:Z" })
  })
})
