const CREDENTIAL_STORAGE_KEY = 'pridetech.lockCredentialId'

/* Read and written the way the remembered spreadsheet is (storedSpreadsheetId.ts):
   storage that throws reads as "no lock set up". A device that cannot keep the
   id cannot keep the lock either, and the app must still open. */
export const readStoredLockCredential = (): string | undefined => {
  try {
    const stored = window.localStorage.getItem(CREDENTIAL_STORAGE_KEY)?.trim()
    return stored === undefined || stored === '' ? undefined : stored
  } catch {
    return undefined
  }
}

export const writeStoredLockCredential = (credentialId: string): void => {
  try {
    window.localStorage.setItem(CREDENTIAL_STORAGE_KEY, credentialId)
  } catch {
    return
  }
}

export const clearStoredLockCredential = (): void => {
  try {
    window.localStorage.removeItem(CREDENTIAL_STORAGE_KEY)
  } catch {
    return
  }
}
