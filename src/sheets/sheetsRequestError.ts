const EXPIRED_SESSION_STATUS = 401

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
