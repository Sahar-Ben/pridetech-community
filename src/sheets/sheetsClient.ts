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
}

export type CreateSheetsClient = (options: {
  spreadsheetId: string
  getAccessToken: () => string
}) => SheetsClient

type ErrorBody = { error?: { message?: string } }

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

export const createSheetsClient = ({
  spreadsheetId,
  getAccessToken,
  fetchImpl = fetch,
}: {
  spreadsheetId: string
  getAccessToken: () => string
  fetchImpl?: typeof fetch
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
    const response = await fetchImpl(`${SHEETS_API_BASE}/${spreadsheetId}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
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
  }
}
