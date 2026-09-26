import { describe, expect, it } from 'vitest'
import { createSheetColumns } from './sheetColumns'

const columns = createSheetColumns({
  tabName: 'Event sheets',
  columns: {
    eventId: { label: 'Event ID', aliases: ['event id'] },
    role: { label: 'Role', aliases: ['role'] },
    mapping: { label: 'Column mapping', aliases: ['column mapping'] },
  },
})

const HEADER_ROW = ['Event ID', 'Role', 'Column mapping']

describe('createSheetColumns, locating', () => {
  it('should find every column of a header row spelled as the app writes it', () => {
    expect(columns.locate(HEADER_ROW)).toEqual({ eventId: 0, role: 1, mapping: 2 })
  })

  it('should find a column whose heading was typed with different case and spacing', () => {
    expect(columns.locate(['event  id', 'ROLE', 'Column mapping'])).toEqual({
      eventId: 0,
      role: 1,
      mapping: 2,
    })
  })

  it('should leave out a column the header row does not have', () => {
    expect(columns.locate(['Event ID'])).toEqual({ eventId: 0 })
  })

  it('should name the missing columns by the heading the organiser would look for', () => {
    expect(
      columns.findMissing({ headerRow: ['Event ID'], targets: ['role', 'mapping'] }),
    ).toEqual(['Role', 'Column mapping'])
  })
})

describe('createSheetColumns, reading', () => {
  it('should read the cell under the named heading, wherever that heading sits', () => {
    expect(
      columns.readCell({
        headerRow: ['Role', 'Event ID'],
        row: ['main', 'evt-1'],
        target: 'eventId',
      }),
    ).toBe('evt-1')
  })

  it('should read a cell the row never reached as absent rather than empty text', () => {
    expect(columns.readCell({ headerRow: HEADER_ROW, row: ['evt-1'], target: 'role' })).toBe(
      undefined,
    )
  })
})

describe('createSheetColumns, writing', () => {
  it('should address each named cell on its own, quoting a tab name that needs it', () => {
    expect(
      columns.buildCellWrites({
        headerRow: HEADER_ROW,
        rowNumber: 4,
        writes: [
          { target: 'role', value: 'waiting list' },
          { target: 'eventId', value: 'evt-1' },
        ],
      }),
    ).toEqual([
      { range: "'Event sheets'!B4", value: 'waiting list' },
      { range: "'Event sheets'!A4", value: 'evt-1' },
    ])
  })

  it('should refuse the whole write when a column it was asked for is not there', () => {
    expect(() =>
      columns.buildCellWrites({
        headerRow: ['Event ID'],
        rowNumber: 4,
        writes: [{ target: 'role', value: 'main' }],
      }),
    ).toThrow(/Role/)
  })

  it('should say nothing was written when it refuses', () => {
    expect(() =>
      columns.buildCellWrites({
        headerRow: ['Event ID'],
        rowNumber: 4,
        writes: [{ target: 'role', value: 'main' }],
      }),
    ).toThrow(/nothing was written/i)
  })

  it('should build a whole row wide enough for the header, with blanks where nothing was given', () => {
    expect(
      columns.buildRow({
        headerRow: HEADER_ROW,
        writes: [{ target: 'mapping', value: '{}' }],
      }),
    ).toEqual(['', '', '{}'])
  })
})
