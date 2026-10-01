import type { SheetsClient } from './sheetsClient'

/* Every screen reads the tabs it shows when it opens, and moving between
   screens opens them again: Overview, Leads and Members all read the Members
   tab, and the Events screen reads its registry twice and the Members tab once
   more. A few laps of the nav went past Google's limit of about 60 reads a
   minute per person, and every screen failed with "Quota exceeded".

   This keeps what a screen read for a short while and hands it to the next
   screen that asks for the same range. It is for display only
   (`readRangeForDisplay`): `readRange` still asks Google every time, because
   the reads that check a row just before writing to it must see the sheet as
   it is now. Any write through this client forgets everything, so what the
   app changed is never shown as it was; the Reload and Try again buttons
   forget it too, for changes made in Google Sheets itself. */
export const DISPLAY_READ_TTL_MS = 60_000

type Entry = {
  readAt: number
  rows: Promise<string[][]>
}

/* Each caller gets its own copy, so one screen trimming a row cannot change
   what the next screen is handed. */
const copyRows = (rows: readonly (readonly string[])[]): string[][] => rows.map((row) => [...row])

export const withReadCache = (
  client: SheetsClient,
  { ttlMs = DISPLAY_READ_TTL_MS, now = Date.now }: { ttlMs?: number; now?: () => number } = {},
): SheetsClient => {
  const entries = new Map<string, Entry>()

  const forgetCachedReads = () => {
    entries.clear()
  }

  /* Forgotten whether the write succeeded or not: a write that failed partway
     may still have changed something, and a stale screen is the worse error. */
  const afterWrite = async (write: () => Promise<void>): Promise<void> => {
    try {
      await write()
    } finally {
      forgetCachedReads()
    }
  }

  const readRangeForDisplay = async ({ range }: { range: string }): Promise<string[][]> => {
    const remembered = entries.get(range)
    if (remembered !== undefined && now() - remembered.readAt < ttlMs) {
      return copyRows(await remembered.rows)
    }
    /* Remembered while still in flight, so two screens asking at once share
       one request; a failure is not remembered, so the next ask tries again. */
    const rows = client.readRange({ range })
    const entry = { readAt: now(), rows }
    entries.set(range, entry)
    rows.catch(() => {
      if (entries.get(range) === entry) {
        entries.delete(range)
      }
    })
    return copyRows(await rows)
  }

  return {
    ...client,
    readRangeForDisplay,
    forgetCachedReads,
    appendRow: async (options) => {
      await afterWrite(async () => {
        await client.appendRow(options)
      })
    },
    updateCell: async (options) => {
      await afterWrite(async () => {
        await client.updateCell(options)
      })
    },
    updateCells: async (options) => {
      await afterWrite(async () => {
        await client.updateCells(options)
      })
    },
    addTabs: async (options) => {
      await afterWrite(async () => {
        await client.addTabs(options)
      })
    },
  }
}

/* The display read where the client has one, the plain read where it does not
   (the test fakes, a client made without a cache). */
export const readForDisplay = async ({
  sheetsClient,
  range,
}: {
  sheetsClient: SheetsClient
  range: string
}): Promise<string[][]> =>
  sheetsClient.readRangeForDisplay === undefined
    ? await sheetsClient.readRange({ range })
    : await sheetsClient.readRangeForDisplay({ range })
