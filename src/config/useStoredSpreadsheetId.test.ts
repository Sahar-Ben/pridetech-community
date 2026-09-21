import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useStoredSpreadsheetId } from './useStoredSpreadsheetId'

afterEach(() => {
  window.localStorage.clear()
})

describe('useStoredSpreadsheetId', () => {
  it('should start with no spreadsheet when none was ever chosen', () => {
    const { result } = renderHook(() => useStoredSpreadsheetId())

    expect(result.current.spreadsheetId).toBeUndefined()
  })

  it('should start with the spreadsheet chosen in an earlier session', () => {
    window.localStorage.setItem('pridetech.spreadsheetId', 'remembered-sheet')

    const { result } = renderHook(() => useStoredSpreadsheetId())

    expect(result.current.spreadsheetId).toBe('remembered-sheet')
  })

  it('should remember a newly chosen spreadsheet for the next session', () => {
    const { result } = renderHook(() => useStoredSpreadsheetId())

    act(() => {
      result.current.selectSpreadsheet({ spreadsheetId: 'chosen-sheet', name: undefined })
    })

    expect(result.current.spreadsheetId).toBe('chosen-sheet')
    expect(window.localStorage.getItem('pridetech.spreadsheetId')).toBe('chosen-sheet')
  })

  it('should replace the remembered spreadsheet when a different one is chosen', () => {
    const { result } = renderHook(() => useStoredSpreadsheetId())

    act(() => {
      result.current.selectSpreadsheet({ spreadsheetId: 'first-sheet', name: undefined })
    })
    act(() => {
      result.current.selectSpreadsheet({ spreadsheetId: 'second-sheet', name: undefined })
    })

    expect(result.current.spreadsheetId).toBe('second-sheet')
  })
})

describe('useStoredSpreadsheetId, the name of the chosen spreadsheet', () => {
  it('should remember the name beside the id, so the workspace can say which sheet it writes to', () => {
    const { result } = renderHook(() => useStoredSpreadsheetId())

    act(() => {
      result.current.selectSpreadsheet({ spreadsheetId: 'sheet-1', name: 'WRITE TEST' })
    })

    expect(result.current.spreadsheetName).toBe('WRITE TEST')
    expect(window.localStorage.getItem('pridetech.spreadsheetName')).toBe('WRITE TEST')
  })

  it('should report no name rather than a stale one when the picker gave none', () => {
    window.localStorage.setItem('pridetech.spreadsheetName', 'An older sheet')
    const { result } = renderHook(() => useStoredSpreadsheetId())

    act(() => {
      result.current.selectSpreadsheet({ spreadsheetId: 'sheet-2', name: undefined })
    })

    expect(result.current.spreadsheetName).toBeUndefined()
    expect(window.localStorage.getItem('pridetech.spreadsheetName')).toBeNull()
  })

  it('should start with the name stored in an earlier session', () => {
    window.localStorage.setItem('pridetech.spreadsheetId', 'remembered-sheet')
    window.localStorage.setItem('pridetech.spreadsheetName', 'Remembered sheet')

    const { result } = renderHook(() => useStoredSpreadsheetId())

    expect(result.current.spreadsheetName).toBe('Remembered sheet')
  })

  it('should forget the name along with the spreadsheet', () => {
    const { result } = renderHook(() => useStoredSpreadsheetId())

    act(() => {
      result.current.selectSpreadsheet({ spreadsheetId: 'sheet-1', name: 'WRITE TEST' })
    })
    act(() => {
      result.current.forgetSpreadsheet()
    })

    expect(result.current.spreadsheetName).toBeUndefined()
  })
})
