const STORAGE_KEY = 'pridetech.spreadsheetId'

/* Private-mode browsers, disabled site data and storage quotas all turn a
   localStorage call into a throw. A remembered spreadsheet is a convenience, so
   every failure here degrades to "nothing remembered" rather than breaking sign-in. */
const safeReadItem = (key: string): string | undefined => {
  try {
    return window.localStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

const safeWriteItem = ({ key, value }: { key: string; value: string }): void => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

const safeRemoveItem = (key: string): void => {
  try {
    window.localStorage.removeItem(key)
  } catch {
    return
  }
}

export const readStoredSpreadsheetId = (): string | undefined => {
  const stored = safeReadItem(STORAGE_KEY)?.trim()
  if (stored === undefined || stored === '') {
    return undefined
  }
  return stored
}

export const writeStoredSpreadsheetId = (spreadsheetId: string): void => {
  safeWriteItem({ key: STORAGE_KEY, value: spreadsheetId })
}

export const clearStoredSpreadsheetId = (): void => {
  safeRemoveItem(STORAGE_KEY)
}
