const ID_STORAGE_KEY = 'pridetech.spreadsheetId'

/* Stored apart from the id rather than as one JSON value: a session that
   remembers an id written before names were kept has to keep working, and a
   second key degrades to "no name" on its own. */
const NAME_STORAGE_KEY = 'pridetech.spreadsheetName'

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
  const stored = safeReadItem(ID_STORAGE_KEY)?.trim()
  if (stored === undefined || stored === '') {
    return undefined
  }
  return stored
}

export const writeStoredSpreadsheetId = (spreadsheetId: string): void => {
  safeWriteItem({ key: ID_STORAGE_KEY, value: spreadsheetId })
}

export const clearStoredSpreadsheetId = (): void => {
  safeRemoveItem(ID_STORAGE_KEY)
}

export const readStoredSpreadsheetName = (): string | undefined => {
  const stored = safeReadItem(NAME_STORAGE_KEY)?.trim()
  if (stored === undefined || stored === '') {
    return undefined
  }
  return stored
}

export const writeStoredSpreadsheetName = (name: string): void => {
  safeWriteItem({ key: NAME_STORAGE_KEY, value: name })
}

export const clearStoredSpreadsheetName = (): void => {
  safeRemoveItem(NAME_STORAGE_KEY)
}
