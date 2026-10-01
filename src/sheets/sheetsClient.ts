import { SheetsRequestError } from './sheetsRequestError'

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

/* Google re-parses a USER_ENTERED value exactly as if a person had typed it into
   the cell: a leading `=` becomes a formula, a leading `+` becomes arithmetic,
   `0501234567` loses its zero, and `03/05/2024` is read in the spreadsheet's own
   locale. That is right for a value a person just chose and wrong for a value
   this app read back out of a cell, so the caller states which it has. */
export type ValueInputOption = 'RAW' | 'USER_ENTERED'

export type CellWrite = {
  range: string
  value: string
}

export type SheetsClient = {
  spreadsheetId: string
  readRange: (options: { range: string }) => Promise<string[][]>
  /* For reads that only put a screen up: may answer from a short-lived copy
     (see readCache.ts). A read that checks a row before writing to it uses
     `readRange`, which always asks Google. Absent on clients without a cache. */
  readRangeForDisplay?: (options: { range: string }) => Promise<string[][]>
  /* Drops every remembered read, so the next one asks Google: called by the
     Reload and Try again buttons. */
  forgetCachedReads?: () => void
  appendRow: (options: {
    range: string
    values: readonly string[]
    valueInputOption: ValueInputOption
  }) => Promise<void>
  updateCell: (options: {
    range: string
    value: string
    valueInputOption: ValueInputOption
  }) => Promise<void>
  updateCells: (options: {
    writes: readonly CellWrite[]
    valueInputOption: ValueInputOption
  }) => Promise<void>
  readTabNames: () => Promise<readonly string[]>
  addTabs: (options: { tabNames: readonly string[] }) => Promise<void>
}

export type CreateSheetsClient = (options: {
  spreadsheetId: string
  getAccessToken: () => string
}) => SheetsClient

type ErrorBody = { error?: { message?: string } }

type SpreadsheetTabsBody = { sheets?: readonly { properties?: { title?: string } }[] }

const readErrorDetail = async (response: Response): Promise<string> => {
  const body = (await response.json().catch(() => ({}))) as ErrorBody
  return body.error?.message ?? 'no detail'
}

/* FORMATTED_VALUE is the API default, and pinning it is still load-bearing: under
   UNFORMATTED_VALUE the same cells come back as JSON numbers and serial-number dates,
   which every downstream trim() would throw on while the types kept claiming string. */
const READ_QUERY = 'valueRenderOption=FORMATTED_VALUE'

const toCellText = (cell: unknown): string => {
  if (cell === null || cell === undefined) {
    return ''
  }
  return String(cell)
}

const describeRanges = (writes: readonly CellWrite[]): string =>
  writes.map((write) => write.range).join(', ')

/* Google allows about 60 reads a minute per person. Going over it, or a
   moment of Google being busy, is answered with 429 or 503 and nothing done,
   so asking again after a pause is safe for reads and writes alike. The waits
   double, and a Retry-After from Google is honoured when it is longer. */
const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([429, 503])

export const DEFAULT_RETRY_DELAYS_MS: readonly number[] = [1000, 2000, 4000, 8000]

const MAX_RETRY_AFTER_MS = 30_000

const retryAfterMs = (response: Response): number | undefined => {
  const header = response.headers.get('Retry-After')
  const seconds = header === null ? Number.NaN : Number(header)
  return Number.isFinite(seconds) ? Math.min(seconds * 1000, MAX_RETRY_AFTER_MS) : undefined
}

const waitFor = async (milliseconds: number): Promise<void> =>
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })

export const createSheetsClient = ({
  spreadsheetId,
  getAccessToken,
  fetchImpl = fetch,
  retryDelaysMs = DEFAULT_RETRY_DELAYS_MS,
  sleep = waitFor,
}: {
  spreadsheetId: string
  getAccessToken: () => string
  fetchImpl?: typeof fetch
  retryDelaysMs?: readonly number[]
  sleep?: (milliseconds: number) => Promise<void>
}): SheetsClient => {
  const request = async ({
    range,
    path,
    method,
    body,
  }: {
    range: string
    path: string
    method: string
    body?: unknown
  }): Promise<unknown> => {
    const send = async (): Promise<Response> =>
      await fetchImpl(`${SHEETS_API_BASE}/${spreadsheetId}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })

    let response = await send()
    for (const delay of retryDelaysMs) {
      if (!RETRYABLE_STATUSES.has(response.status)) {
        break
      }
      await sleep(Math.max(delay, retryAfterMs(response) ?? 0))
      response = await send()
    }
    if (!response.ok) {
      throw new SheetsRequestError({
        range,
        status: response.status,
        detail: await readErrorDetail(response),
      })
    }
    return await response.json().catch(() => ({}))
  }

  return {
    spreadsheetId,

    readRange: async ({ range }) => {
      const body = await request({
        range,
        method: 'GET',
        path: `/values/${encodeURIComponent(range)}?${READ_QUERY}`,
      })
      const { values } = body as { values?: unknown[][] }
      if (values === undefined) {
        return []
      }
      return values.map((row) => row.map(toCellText))
    },

    appendRow: async ({ range, values, valueInputOption }) => {
      await request({
        range,
        method: 'POST',
        path: `/values/${encodeURIComponent(range)}:append?valueInputOption=${valueInputOption}&insertDataOption=INSERT_ROWS`,
        body: { values: [values] },
      })
    },

    updateCell: async ({ range, value, valueInputOption }) => {
      await request({
        range,
        method: 'PUT',
        path: `/values/${encodeURIComponent(range)}?valueInputOption=${valueInputOption}`,
        body: { values: [[value]] },
      })
    },

    /* Several disjoint cells in one request, so a set of related edits cannot
       stop halfway and leave a row that is half the old person and half the new
       one. Each cell is addressed on its own rather than as a span, which is
       what keeps the cells between them from being written back at all. */
    updateCells: async ({ writes, valueInputOption }) => {
      if (writes.length === 0) {
        return
      }
      await request({
        range: describeRanges(writes),
        method: 'POST',
        path: '/values:batchUpdate',
        body: {
          valueInputOption,
          data: writes.map(({ range, value }) => ({ range, values: [[value]] })),
        },
      })
    },

    /* Titles only. The full `spreadsheets.get` answers with every cell of every
       tab, which on this spreadsheet is a thousand applications and 787 members
       fetched to learn three names. */
    readTabNames: async () => {
      const body = await request({
        range: 'the list of tabs',
        method: 'GET',
        path: '?fields=sheets.properties.title',
      })
      const { sheets } = body as SpreadsheetTabsBody
      return (sheets ?? []).flatMap(({ properties }) =>
        properties?.title === undefined ? [] : [properties.title],
      )
    },

    /* `spreadsheets.batchUpdate` rather than the values endpoints every other
       write here uses: this one changes the structure of the spreadsheet rather
       than its contents, and it is the first call in this app that does. All of
       the tabs go in one request so a refusal leaves the spreadsheet exactly as
       it was rather than one tab into a three-tab registry. */
    addTabs: async ({ tabNames }) => {
      if (tabNames.length === 0) {
        return
      }
      await request({
        range: `the new tabs ${tabNames.join(', ')}`,
        method: 'POST',
        path: ':batchUpdate',
        body: {
          requests: tabNames.map((title) => ({ addSheet: { properties: { title } } })),
        },
      })
    },
  }
}
