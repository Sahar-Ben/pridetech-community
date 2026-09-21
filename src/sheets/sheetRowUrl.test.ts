import { describe, expect, it } from 'vitest'
import { buildSheetRowUrl } from './sheetRowUrl'

describe('buildSheetRowUrl', () => {
  it('should open the spreadsheet with that row of that tab selected', () => {
    const url = buildSheetRowUrl({ spreadsheetId: '1AbC', tabName: 'Leads', rowNumber: 412 })

    expect(url).toBe('https://docs.google.com/spreadsheets/d/1AbC/edit?range=Leads!A412')
  })

  it('should open the spreadsheet the reviewer picked rather than a fixed one', () => {
    const first = buildSheetRowUrl({ spreadsheetId: 'first-sheet', tabName: 'Leads', rowNumber: 2 })
    const second = buildSheetRowUrl({
      spreadsheetId: 'second-sheet',
      tabName: 'Leads',
      rowNumber: 2,
    })

    expect(first).toContain('/d/first-sheet/')
    expect(second).toContain('/d/second-sheet/')
  })

  it('should keep a tab whose name has a space usable as a link', () => {
    const url = buildSheetRowUrl({ spreadsheetId: '1AbC', tabName: 'Old Leads', rowNumber: 7 })

    expect(url).toBe('https://docs.google.com/spreadsheets/d/1AbC/edit?range=Old%20Leads!A7')
  })
})
