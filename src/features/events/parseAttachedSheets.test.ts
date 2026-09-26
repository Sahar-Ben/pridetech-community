import { describe, expect, it } from 'vitest'
import { EVENT_SHEETS_HEADINGS } from './eventRegistryTabs'
import { parseAttachedSheets } from './parseAttachedSheets'
import { recordColumnMapping } from './responseSheetMapping'

const HEADER_ROW = [...EVENT_SHEETS_HEADINGS]

const MAPPING = recordColumnMapping({ timestamp: 0, name: 1, email: 2 })

const attachedRow = ({
  eventId = 'evt-1',
  spreadsheetId = 'response-sheet-1',
  sheetName = 'Form Responses 1',
  role = 'main',
  mapping = MAPPING,
}: {
  eventId?: string
  spreadsheetId?: string
  sheetName?: string
  role?: string
  mapping?: string
} = {}): string[] => [eventId, spreadsheetId, sheetName, role, mapping]

describe('parseAttachedSheets', () => {
  it('should read an attached response sheet and its mapping', () => {
    const { sheets } = parseAttachedSheets({ rows: [HEADER_ROW, attachedRow()] })

    expect(sheets).toEqual([
      {
        rowNumber: 2,
        eventId: 'evt-1',
        spreadsheetId: 'response-sheet-1',
        sheetName: 'Form Responses 1',
        role: 'main',
        mapping: { timestamp: 0, name: 1, email: 2 },
      },
    ])
  })

  it('should read more than one sheet for one event, which is why this is its own tab', () => {
    const { sheets } = parseAttachedSheets({
      rows: [
        HEADER_ROW,
        attachedRow({ sheetName: 'Form Responses 1' }),
        attachedRow({ sheetName: 'Waiting list', role: 'waiting list' }),
      ],
    })

    expect(sheets.map((sheet) => sheet.role)).toEqual(['main', 'waiting list'])
  })

  it('should read a role typed in another case as the role it is', () => {
    const { sheets } = parseAttachedSheets({
      rows: [HEADER_ROW, attachedRow({ role: 'Waiting List' })],
    })

    expect(sheets[0]?.role).toBe('waiting list')
  })

  it('should record that a sheet has no email column rather than lose the fact', () => {
    const { sheets } = parseAttachedSheets({
      rows: [HEADER_ROW, attachedRow({ mapping: recordColumnMapping({ name: 1 }) })],
    })

    expect(sheets[0]?.mapping).toEqual({ name: 1 })
  })

  it('should skip a spacer row', () => {
    const { sheets, issues } = parseAttachedSheets({ rows: [HEADER_ROW, [], ['', ' ']] })

    expect(sheets).toEqual([])
    expect(issues).toEqual([])
  })

  it('should return nothing at all for a tab holding only its headings', () => {
    expect(parseAttachedSheets({ rows: [HEADER_ROW] })).toEqual({ sheets: [], issues: [] })
  })
})

describe('parseAttachedSheets, where a row cannot be trusted', () => {
  it('should drop a row with no event id, which points at no event', () => {
    const { sheets, issues } = parseAttachedSheets({
      rows: [HEADER_ROW, attachedRow({ eventId: '' })],
    })

    expect(sheets).toEqual([])
    expect(issues).toEqual([{ kind: 'no-event-id', rowNumber: 2 }])
  })

  it('should drop a row naming no spreadsheet or no sheet, since neither can be opened', () => {
    const { sheets, issues } = parseAttachedSheets({
      rows: [HEADER_ROW, attachedRow({ spreadsheetId: '' }), attachedRow({ sheetName: '' })],
    })

    expect(sheets).toEqual([])
    expect(issues.map((issue) => issue.kind)).toEqual(['no-sheet', 'no-sheet'])
  })

  it('should keep a sheet whose role it does not recognise, and say so', () => {
    const { sheets, issues } = parseAttachedSheets({
      rows: [HEADER_ROW, attachedRow({ role: 'overflow' })],
    })

    expect(sheets[0]?.role).toBe('main')
    expect(issues).toEqual([{ kind: 'unknown-role', rowNumber: 2, recordedRole: 'overflow' }])
  })

  it('should keep a sheet whose mapping cell cannot be read, and not pass off an empty mapping', () => {
    const { sheets, issues } = parseAttachedSheets({
      rows: [HEADER_ROW, attachedRow({ mapping: 'email is column D' })],
    })

    expect(sheets[0]?.mapping).toBe(undefined)
    expect(issues).toEqual([{ kind: 'unreadable-mapping', rowNumber: 2 }])
  })
})

describe('parseAttachedSheets, where the tab itself is wrong', () => {
  it('should refuse a tab with no header row', () => {
    expect(() => parseAttachedSheets({ rows: [] })).toThrow(/Event sheets tab/)
  })

  it('should name the heading a tab is missing', () => {
    expect(() => parseAttachedSheets({ rows: [['Event ID', 'Role']] })).toThrow(/Spreadsheet ID/)
  })
})
