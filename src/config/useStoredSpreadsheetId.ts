import { useCallback, useState } from 'react'
import {
  clearStoredSpreadsheetId,
  readStoredSpreadsheetId,
  writeStoredSpreadsheetId,
} from './storedSpreadsheetId'

export type StoredSpreadsheetId = {
  spreadsheetId: string | undefined
  selectSpreadsheet: (spreadsheetId: string) => void
  forgetSpreadsheet: () => void
}

export const useStoredSpreadsheetId = (): StoredSpreadsheetId => {
  const [spreadsheetId, setSpreadsheetId] = useState(readStoredSpreadsheetId)

  const selectSpreadsheet = useCallback((chosenSpreadsheetId: string) => {
    writeStoredSpreadsheetId(chosenSpreadsheetId)
    setSpreadsheetId(chosenSpreadsheetId)
  }, [])

  const forgetSpreadsheet = useCallback(() => {
    clearStoredSpreadsheetId()
    setSpreadsheetId(undefined)
  }, [])

  return { spreadsheetId, selectSpreadsheet, forgetSpreadsheet }
}
