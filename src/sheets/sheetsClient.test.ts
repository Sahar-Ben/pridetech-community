import { describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { createSheetsClient } from './sheetsClient'
import { isExpiredSessionError, SheetsRequestError } from './sheetsRequestError'

const jsonResponse = ({ body, status }: { body: unknown; status: number }): Response =>
  new Response(JSON.stringify(body), { status })

const okFetch = (body: unknown): Mock<typeof fetch> =>
  vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ body, status: 200 }))

const firstCallOf = (fetchSpy: Mock<typeof fetch>) => {
  const call = fetchSpy.mock.calls[0]
  if (call === undefined) {
    throw new Error('fetch was never called')
  }
  const [url, init] = call
  const headers = (init?.headers ?? {}) as Record<string, string>
  return { url: String(url), init, headers }
}

describe('createSheetsClient', () => {
  it('should request the named range with a bearer token', async () => {
    const fetchSpy = okFetch({ values: [['a']] })
    const client = createSheetsClient({
      spreadsheetId: 'sheet-1',
      getAccessToken: () => 'token-1',
      fetchImpl: fetchSpy,
    })

    await client.readRange({ range: 'Leads!A1:Z' })

    const { url, headers } = firstCallOf(fetchSpy)
    expect(url).toContain('https://sheets.googleapis.com/v4/spreadsheets/sheet-1/values/Leads!A1%3AZ')
    expect(headers.Authorization).toBe('Bearer token-1')
  })

  it('should pin FORMATTED_VALUE so numbers and dates arrive as the strings the sheet shows', async () => {
    const fetchSpy = okFetch({ values: [['a']] })
    const client = createSheetsClient({
      spreadsheetId: 's',
      getAccessToken: () => 't',
      fetchImpl: fetchSpy,
    })

    await client.readRange({ range: 'Leads!A1:Z' })

    expect(firstCallOf(fetchSpy).url).toContain('valueRenderOption=FORMATTED_VALUE')
  })

  it('should return an empty array when the range holds no values', async () => {
    const client = createSheetsClient({
      spreadsheetId: 's',
      getAccessToken: () => 't',
      fetchImpl: okFetch({}),
    })

    expect(await client.readRange({ range: 'Leads!A1:Z' })).toEqual([])
  })

  it('should turn a numeric cell into a string so downstream trimming cannot throw', async () => {
    const client = createSheetsClient({
      spreadsheetId: 's',
      getAccessToken: () => 't',
      fetchImpl: okFetch({ values: [[972_542_353_073, true]] }),
    })

    expect(await client.readRange({ range: 'Leads!A1:Z' })).toEqual([['972542353073', 'true']])
  })

  it('should turn a null cell into an empty string rather than the text "null"', async () => {
    const client = createSheetsClient({
      spreadsheetId: 's',
      getAccessToken: () => 't',
      fetchImpl: okFetch({ values: [[null, undefined, 'kept']] }),
    })

    expect(await client.readRange({ range: 'Leads!A1:Z' })).toEqual([['', '', 'kept']])
  })

  it('should append a row with USER_ENTERED so dates and links stay usable in the sheet', async () => {
    const fetchSpy = okFetch({})
    const client = createSheetsClient({
      spreadsheetId: 's',
      getAccessToken: () => 't',
      fetchImpl: fetchSpy,
    })

    await client.appendRow({ range: 'Members!A:Z', values: ['a', 'b'] })

    const { url, init } = firstCallOf(fetchSpy)
    expect(url).toContain(':append')
    expect(url).toContain('valueInputOption=USER_ENTERED')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ values: [['a', 'b']] })
  })

  it('should update a single cell in place', async () => {
    const fetchSpy = okFetch({})
    const client = createSheetsClient({
      spreadsheetId: 's',
      getAccessToken: () => 't',
      fetchImpl: fetchSpy,
    })

    await client.updateCell({ range: 'Leads!K2', value: 'Approved' })

    const { url, init } = firstCallOf(fetchSpy)
    expect(url).toContain('/values/Leads!K2?valueInputOption=USER_ENTERED')
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(String(init?.body))).toEqual({ values: [['Approved']] })
  })

  it('should throw a message naming the range when the API rejects the call', async () => {
    const client = createSheetsClient({
      spreadsheetId: 's',
      getAccessToken: () => 't',
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse({ body: { error: { message: 'Caller lacks permission' } }, status: 403 }),
      ),
    })

    await expect(client.readRange({ range: 'Leads!A1:Z' })).rejects.toThrow(
      /Leads!A1:Z.*403.*Caller lacks permission/,
    )
  })

  it('should still name the range and status when the failure body is not json', async () => {
    const client = createSheetsClient({
      spreadsheetId: 's',
      getAccessToken: () => 't',
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>', { status: 500 })),
    })

    await expect(client.readRange({ range: 'Leads!A1:Z' })).rejects.toThrow(/Leads!A1:Z.*500/)
  })

  it('should carry the http status on the error so an expired session can be told apart', async () => {
    const client = createSheetsClient({
      spreadsheetId: 's',
      getAccessToken: () => 't',
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse({ body: { error: { message: 'Invalid Credentials' } }, status: 401 }),
      ),
    })

    const error = await client.readRange({ range: 'Leads!A1:Z' }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(SheetsRequestError)
    expect(isExpiredSessionError(error)).toBe(true)
  })

  it('should not treat a permission failure as an expired session', async () => {
    const error = new SheetsRequestError({ range: 'Leads!A1:Z', status: 403, detail: 'nope' })

    expect(isExpiredSessionError(error)).toBe(false)
  })
})
