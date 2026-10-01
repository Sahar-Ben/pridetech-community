import { describe, expect, it, vi } from 'vitest'
import { readForDisplay, withReadCache } from './readCache'
import type { SheetsClient } from './sheetsClient'

const fakeClient = (rowsFor: (range: string) => string[][] = () => [['a']]) => {
  const readRange = vi.fn(
    async ({ range }: { range: string }) => await Promise.resolve(rowsFor(range)),
  )
  const client: SheetsClient = {
    spreadsheetId: 'sheet-1',
    readRange,
    appendRow: vi.fn(async () => await Promise.resolve()),
    updateCell: vi.fn(async () => await Promise.resolve()),
    updateCells: vi.fn(async () => await Promise.resolve()),
    readTabNames: vi.fn(async () => await Promise.resolve(['Members'])),
    addTabs: vi.fn(async () => await Promise.resolve()),
  }
  return { client, readRange }
}

const clock = () => {
  let time = 0
  return { now: () => time, advance: (ms: number) => (time += ms) }
}

describe('withReadCache', () => {
  it('should answer a second display read of the same range without asking Google', async () => {
    const { client, readRange } = fakeClient()
    const cached = withReadCache(client)

    await readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })
    await readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })

    expect(readRange).toHaveBeenCalledTimes(1)
  })

  it('should share one request between two screens asking at the same moment', async () => {
    const { client, readRange } = fakeClient()
    const cached = withReadCache(client)

    await Promise.all([
      readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' }),
      readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' }),
    ])

    expect(readRange).toHaveBeenCalledTimes(1)
  })

  it('should ask Google again once the remembered read is a minute old', async () => {
    const { client, readRange } = fakeClient()
    const time = clock()
    const cached = withReadCache(client, { ttlMs: 60_000, now: time.now })

    await readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })
    time.advance(60_000)
    await readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })

    expect(readRange).toHaveBeenCalledTimes(2)
  })

  it('should always ask Google for a plain read, which checks a row before writing to it', async () => {
    const { client, readRange } = fakeClient()
    const cached = withReadCache(client)

    await readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })
    await cached.readRange({ range: 'Members!A1:Z' })
    await cached.readRange({ range: 'Members!A1:Z' })

    expect(readRange).toHaveBeenCalledTimes(3)
  })

  it.each([
    [
      'appendRow',
      (client: SheetsClient) =>
        client.appendRow({ range: 'Members!A:Z', values: ['x'], valueInputOption: 'RAW' }),
    ],
    [
      'updateCell',
      (client: SheetsClient) =>
        client.updateCell({ range: 'Leads!K2', value: 'x', valueInputOption: 'RAW' }),
    ],
    [
      'updateCells',
      (client: SheetsClient) =>
        client.updateCells({
          writes: [{ range: 'Leads!K2', value: 'x' }],
          valueInputOption: 'RAW',
        }),
    ],
    ['addTabs', (client: SheetsClient) => client.addTabs({ tabNames: ['Events'] })],
  ])(
    'should forget everything after %s, so the app never shows what it just changed as it was',
    async (_name, write) => {
      const { client, readRange } = fakeClient()
      const cached = withReadCache(client)

      await readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })
      await write(cached)
      await readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })

      expect(readRange).toHaveBeenCalledTimes(2)
    },
  )

  it('should forget everything when asked, for the Reload button', async () => {
    const { client, readRange } = fakeClient()
    const cached = withReadCache(client)

    await readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })
    cached.forgetCachedReads?.()
    await readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })

    expect(readRange).toHaveBeenCalledTimes(2)
  })

  it('should not remember a failed read, so the next screen tries again', async () => {
    const { client, readRange } = fakeClient()
    readRange.mockRejectedValueOnce(new Error('quota'))
    const cached = withReadCache(client)

    await expect(readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })).rejects.toThrow(
      'quota',
    )
    await expect(readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })).resolves.toEqual([
      ['a'],
    ])
    expect(readRange).toHaveBeenCalledTimes(2)
  })

  it('should hand each screen its own copy of the rows', async () => {
    const { client } = fakeClient()
    const cached = withReadCache(client)

    const first = await readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })
    first[0]?.splice(0, 1, 'changed by a screen')
    const second = await readForDisplay({ sheetsClient: cached, range: 'Members!A1:Z' })

    expect(second).toEqual([['a']])
  })
})
