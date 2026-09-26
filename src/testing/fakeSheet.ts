import { vi } from 'vitest'
import type { CellWrite, SheetsClient, ValueInputOption } from '../sheets/sheetsClient'

const LETTER_A = 'A'.charCodeAt(0)
const ALPHABET_LENGTH = 26

/* The tab name is matched in two shapes because A1 notation has two: a bare
   word, and anything else wrapped in apostrophes with its own apostrophes
   doubled. `Event sheets` and a picked response sheet's tab both take the
   second shape, so a fake that only read the first would answer every registry
   read with an empty tab. */
const RANGE_PATTERN =
  /^(?:'(?<quotedTabName>(?:[^']|'')+)'|(?<tabName>[^'!]+))!(?<startLetters>[A-Z]+)(?<startRow>\d+)?(?::(?<endLetters>[A-Z]+)(?<endRow>\d+)?)?$/

export type SheetWrite = {
  kind: 'append' | 'update'
  range: string
  values: readonly string[]
  valueInputOption: ValueInputOption
}

export type FakeSheet = {
  client: SheetsClient
  writes: readonly SheetWrite[]
  tabNames: () => readonly string[]
  rowsOf: (tabName: string) => readonly (readonly string[])[]
  replaceRows: (options: { tabName: string; rows: readonly (readonly string[])[] }) => void
}

type ParsedRange = {
  tabName: string
  startColumn: number
  endColumn: number
  startRow: number
  endRow: number | undefined
}

const toColumnIndex = (letters: string): number =>
  [...letters].reduce(
    (index, letter) => index * ALPHABET_LENGTH + (letter.charCodeAt(0) - LETTER_A) + 1,
    0,
  ) - 1

const parseRange = (range: string): ParsedRange => {
  const groups = RANGE_PATTERN.exec(range)?.groups
  const quotedTabName = groups?.quotedTabName
  const tabName = quotedTabName === undefined ? groups?.tabName : quotedTabName.replaceAll("''", "'")
  const startLetters = groups?.startLetters
  if (groups === undefined || tabName === undefined || startLetters === undefined) {
    throw new Error(`the fake sheet cannot read the range ${range}`)
  }
  const startColumn = toColumnIndex(startLetters)
  const endLetters = groups.endLetters
  const startRow = groups.startRow === undefined ? 1 : Number(groups.startRow)
  /* An end reference with no row number is open-ended, the way `Leads!A1:Z` is:
     reading only the first row there would hand every caller an empty tab that
     looks like a tab with nothing in it. */
  const endRow = ((): number | undefined => {
    if (endLetters === undefined) {
      return startRow
    }
    return groups.endRow === undefined ? undefined : Number(groups.endRow)
  })()

  return {
    tabName,
    startColumn,
    endColumn: endLetters === undefined ? startColumn : toColumnIndex(endLetters),
    startRow,
    endRow,
  }
}

const PLUS_LED_ARITHMETIC = /^\+\d+(?:-\d+)*$/
const LEADING_ZERO_DIGITS = /^0\d+$/
const DAY_FIRST_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/

const evaluateAsSubtraction = (value: string): string => {
  const [first, ...rest] = value.slice(1).split('-')
  return String(rest.reduce((total, part) => total - Number(part), Number(first)))
}

/* The three things Google actually does to a USER_ENTERED value, and the whole
   reason this fake exists: without them every write looks lossless here and the
   suite cannot tell a value the sheet will keep from one it will silently
   rewrite. A cell written RAW is stored exactly as it was sent, so only this
   path transforms anything. Israeli phone numbers arrive in both shapes below. */
const reparseAsUserEntered = (value: string): string => {
  if (PLUS_LED_ARITHMETIC.test(value)) {
    return evaluateAsSubtraction(value)
  }
  if (LEADING_ZERO_DIGITS.test(value)) {
    return String(Number(value))
  }
  const dayFirst = DAY_FIRST_DATE.exec(value)
  if (dayFirst === null) {
    return value
  }
  const [, day, month, year] = dayFirst
  return `${month}/${day}/${year}`
}

const storedValue = ({
  value,
  valueInputOption,
}: {
  value: string
  valueInputOption: ValueInputOption
}): string => (valueInputOption === 'RAW' ? value : reparseAsUserEntered(value))

/* Google trims trailing blanks out of what it returns, and code that only ever
   met a padded fixture reads a short row as a missing column. */
const trimTrailingBlanks = (cells: readonly string[]): string[] => {
  const lastFilled = cells.findLastIndex((cell) => cell !== '')
  return cells.slice(0, lastFilled + 1)
}

const withRowAt = ({
  rows,
  rowNumber,
  row,
}: {
  rows: readonly (readonly string[])[]
  rowNumber: number
  row: readonly string[]
}): string[][] => {
  const padded = Array.from({ length: Math.max(rows.length, rowNumber) }, (_row, index) => [
    ...(rows[index] ?? []),
  ])
  padded[rowNumber - 1] = [...row]
  return padded
}

/* An in-memory stand-in for the two tabs, addressed the way the Sheets API is
   addressed, so a test can assert what ended up in the sheet and in what order
   rather than only which methods were called. */
export const createFakeSheet = ({
  tabs,
  spreadsheetId = 'test-spreadsheet-id',
  onRead,
  onWrite,
}: {
  tabs: Readonly<Record<string, readonly (readonly string[])[]>>
  spreadsheetId?: string
  onRead?: (range: string) => void
  onWrite?: (write: SheetWrite) => void
}): FakeSheet => {
  const tabRows = new Map<string, string[][]>(
    Object.entries(tabs).map(([tabName, rows]) => [tabName, rows.map((row) => [...row])]),
  )
  const writes: SheetWrite[] = []

  const rowsOf = (tabName: string): readonly (readonly string[])[] => tabRows.get(tabName) ?? []

  const recordWrite = ({ kind, range, values, valueInputOption }: SheetWrite): void => {
    writes.push({ kind, range, values: [...values], valueInputOption })
    onWrite?.({ kind, range, values, valueInputOption })
  }

  const applyWrite = ({
    range,
    values,
    valueInputOption,
  }: {
    range: string
    values: readonly string[]
    valueInputOption: ValueInputOption
  }): void => {
    const parsed = parseRange(range)
    const rows = rowsOf(parsed.tabName)
    const existing = rows[parsed.startRow - 1] ?? []
    const width = Math.max(existing.length, parsed.startColumn + values.length)
    const row = Array.from({ length: width }, (_cell, index) => {
      const written = values[index - parsed.startColumn]
      if (written === undefined) {
        return existing[index] ?? ''
      }
      return storedValue({ value: written, valueInputOption })
    })
    tabRows.set(parsed.tabName, withRowAt({ rows, rowNumber: parsed.startRow, row }))
  }

  const client: SheetsClient = {
    spreadsheetId,

    readRange: vi.fn(async ({ range }: { range: string }) => {
      onRead?.(range)
      const parsed = parseRange(range)
      const rows = rowsOf(parsed.tabName)
      const endRow = parsed.endRow ?? rows.length
      return await Promise.resolve(
        rows
          .slice(parsed.startRow - 1, endRow)
          .map((row) => trimTrailingBlanks(row.slice(parsed.startColumn, parsed.endColumn + 1))),
      )
    }),

    appendRow: vi.fn(
      async ({
        range,
        values,
        valueInputOption,
      }: {
        range: string
        values: readonly string[]
        valueInputOption: ValueInputOption
      }) => {
        recordWrite({ kind: 'append', range, values, valueInputOption })
        const parsed = parseRange(range)
        const rows = rowsOf(parsed.tabName)
        tabRows.set(parsed.tabName, [
          ...rows.map((row) => [...row]),
          values.map((value) => storedValue({ value, valueInputOption })),
        ])
        await Promise.resolve()
      },
    ),

    updateCell: vi.fn(
      async ({
        range,
        value,
        valueInputOption,
      }: {
        range: string
        value: string
        valueInputOption: ValueInputOption
      }) => {
        recordWrite({ kind: 'update', range, values: [value], valueInputOption })
        applyWrite({ range, values: [value], valueInputOption })
        await Promise.resolve()
      },
    ),

    /* Recorded one cell at a time so a test can name the cells that were
       written, and applied only after every cell has been recorded so a test
       that fails the request sees the whole set refused rather than a prefix. */
    updateCells: vi.fn(
      async ({
        writes: cellWrites,
        valueInputOption,
      }: {
        writes: readonly CellWrite[]
        valueInputOption: ValueInputOption
      }) => {
        cellWrites.forEach(({ range, value }) => {
          recordWrite({ kind: 'update', range, values: [value], valueInputOption })
        })
        cellWrites.forEach(({ range, value }) => {
          applyWrite({ range, values: [value], valueInputOption })
        })
        await Promise.resolve()
      },
    ),

    readTabNames: vi.fn(async () => await Promise.resolve([...tabRows.keys()])),

    /* A tab added here starts with no rows at all, which is the state the real
       `addSheet` leaves behind and the state the header write then fills. */
    addTabs: vi.fn(async ({ tabNames }: { tabNames: readonly string[] }) => {
      tabNames.forEach((tabName) => {
        if (tabRows.has(tabName)) {
          throw new Error(`the fake sheet already has a tab named ${tabName}`)
        }
        tabRows.set(tabName, [])
      })
      await Promise.resolve()
    }),
  }

  const replaceRows = ({
    tabName,
    rows,
  }: {
    tabName: string
    rows: readonly (readonly string[])[]
  }): void => {
    tabRows.set(
      tabName,
      rows.map((row) => [...row]),
    )
  }

  return { client, writes, tabNames: () => [...tabRows.keys()], rowsOf, replaceRows }
}
