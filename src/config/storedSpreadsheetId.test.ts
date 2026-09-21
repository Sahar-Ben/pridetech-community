import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearStoredSpreadsheetId,
  readStoredSpreadsheetId,
  writeStoredSpreadsheetId,
} from './storedSpreadsheetId'

const useBrokenLocalStorage = () => {
  const throwOnAccess = () => {
    throw new Error('localStorage is unavailable')
  }
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(throwOnAccess)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(throwOnAccess)
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(throwOnAccess)
}

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('storedSpreadsheetId', () => {
  it('should return undefined when nothing has been stored', () => {
    expect(readStoredSpreadsheetId()).toBeUndefined()
  })

  it('should round-trip a stored id', () => {
    writeStoredSpreadsheetId('spreadsheet-1')

    expect(readStoredSpreadsheetId()).toBe('spreadsheet-1')
  })

  it('should forget the id once it is cleared', () => {
    writeStoredSpreadsheetId('spreadsheet-1')
    clearStoredSpreadsheetId()

    expect(readStoredSpreadsheetId()).toBeUndefined()
  })

  it('should treat a blank stored value as nothing stored', () => {
    window.localStorage.setItem('pridetech.spreadsheetId', '   ')

    expect(readStoredSpreadsheetId()).toBeUndefined()
  })

  it('should return undefined rather than throwing when localStorage throws', () => {
    useBrokenLocalStorage()

    expect(readStoredSpreadsheetId()).toBeUndefined()
  })

  it('should not throw when a write is refused by the browser', () => {
    useBrokenLocalStorage()

    expect(() => writeStoredSpreadsheetId('spreadsheet-1')).not.toThrow()
    expect(() => clearStoredSpreadsheetId()).not.toThrow()
  })
})
