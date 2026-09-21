import { SheetsRequestError } from './sheetsRequestError'

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

export type SheetsClient = {
  readRange: (options: { range: string }) => Promise<string[][]>
  appendRow: (options: { range: string; values: readonly string[] }) => Promise<void>
  updateCell: (options: { range: string; value: string }) => Promise<void>
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
const WRITE_QUERY = 'valueInputOption=USER_ENTERED'

const toCellText = (cell: unknown): string => {
  if (cell === null || cell === undefined) {
    return ''
  }
  return String(cell)
}

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

    appendRow: async ({ range, values }) => {
      await request({
        range,
        method: 'POST',
        path: `/values/${encodeURIComponent(range)}:append?${WRITE_QUERY}&insertDataOption=INSERT_ROWS`,
        body: { values: [values] },
      })
    },

    updateCell: async ({ range, value }) => {
      await request({
        range,
        method: 'PUT',
        path: `/values/${encodeURIComponent(range)}?${WRITE_QUERY}`,
        body: { values: [[value]] },
      })
    },
  }
}
