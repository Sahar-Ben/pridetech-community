const EXPIRED_SESSION_STATUS = 401
const FORBIDDEN_STATUS = 403

export class SheetsRequestError extends Error {
  readonly status: number

  constructor({ range, status, detail }: { range: string; status: number; detail: string }) {
    super(`Sheets request for ${range} failed: ${status} ${detail}`)
    this.name = 'SheetsRequestError'
    this.status = status
  }
}

export const isExpiredSessionError = (error: unknown): boolean =>
  error instanceof SheetsRequestError && error.status === EXPIRED_SESSION_STATUS

/* Told apart from every other refusal because the cause is specific and the cure
   is specific: the `drive.file` grant reaches only the files the reviewer picked
   through the Google Picker, so the answer is to pick this spreadsheet again,
   not to retry and not to sign in again. */
export const isForbiddenError = (error: unknown): boolean =>
  error instanceof SheetsRequestError && error.status === FORBIDDEN_STATUS
