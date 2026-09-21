import { useCallback, useState } from 'react'
import {
  clearStoredSpreadsheetId,
  clearStoredSpreadsheetName,
  readStoredSpreadsheetId,
  readStoredSpreadsheetName,
  writeStoredSpreadsheetId,
  writeStoredSpreadsheetName,
} from './storedSpreadsheetId'
import type { PickedSpreadsheet } from '../picker/spreadsheetPicker'

export type StoredSpreadsheetId = {
  spreadsheetId: string | undefined
  spreadsheetName: string | undefined
  selectSpreadsheet: (spreadsheet: PickedSpreadsheet) => void
  forgetSpreadsheet: () => void
}

export const useStoredSpreadsheetId = (): StoredSpreadsheetId => {
  const [spreadsheetId, setSpreadsheetId] = useState(readStoredSpreadsheetId)
  const [spreadsheetName, setSpreadsheetName] = useState(readStoredSpreadsheetName)

  /* A name only ever describes the id stored with it, so a pick that arrives
     without one clears the old name rather than leaving the previous sheet's
     name over the new sheet's id. */
  const selectSpreadsheet = useCallback((chosen: PickedSpreadsheet) => {
    writeStoredSpreadsheetId(chosen.spreadsheetId)
    setSpreadsheetId(chosen.spreadsheetId)
    if (chosen.name === undefined) {
      clearStoredSpreadsheetName()
    } else {
      writeStoredSpreadsheetName(chosen.name)
    }
    setSpreadsheetName(chosen.name)
  }, [])

  const forgetSpreadsheet = useCallback(() => {
    clearStoredSpreadsheetId()
    clearStoredSpreadsheetName()
    setSpreadsheetId(undefined)
    setSpreadsheetName(undefined)
  }, [])

  return { spreadsheetId, spreadsheetName, selectSpreadsheet, forgetSpreadsheet }
}
