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
      result.current.selectSpreadsheet('chosen-sheet')
    })

    expect(result.current.spreadsheetId).toBe('chosen-sheet')
    expect(window.localStorage.getItem('pridetech.spreadsheetId')).toBe('chosen-sheet')
  })

  it('should replace the remembered spreadsheet when a different one is chosen', () => {
    const { result } = renderHook(() => useStoredSpreadsheetId())

    act(() => {
      result.current.selectSpreadsheet('first-sheet')
    })
    act(() => {
      result.current.selectSpreadsheet('second-sheet')
    })

    expect(result.current.spreadsheetId).toBe('second-sheet')
  })
})
