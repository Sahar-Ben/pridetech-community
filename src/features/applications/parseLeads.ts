import { COLUMN_ALIASES } from '../../sheets/columnAliases'
import { toEmailKey } from '../../sheets/emailKey'
import { buildHeaderMap, findColumn } from '../../sheets/headerMap'
import { readCell } from '../../sheets/readCell'
import type { Lead, LeadStatus } from './lead'

const HEADER_ROW_COUNT = 1

export type LeadWithoutEmail = {
  rowNumber: number
  name: string | undefined
}

/* A row with no email is dropped and reported rather than dropped quietly: it can
   never be matched against the Members tab, so the reviewer is handed the rows
   themselves and can go and fill the address in. */
export type ParsedLeads = {
  leads: readonly Lead[]
  rowsWithoutEmail: readonly LeadWithoutEmail[]
}

/* A spacer row between blocks of applications is not an application that forgot
   its email, so it is left out of the unmatchable count. */
const hasAnyValue = (row: readonly string[]): boolean =>
  row.some((_cell, column) => readCell({ row, column }) !== undefined)

const parseStatus = (value: string | undefined): LeadStatus => {
  const normalized = value?.toLowerCase()
  if (normalized === 'approved') {
    return 'approved'
  }
  if (normalized === 'declined') {
    return 'declined'
  }
  return 'pending'
}

export const parseLeads = ({ rows }: { rows: readonly (readonly string[])[] }): ParsedLeads => {
  const [headerRow, ...dataRows] = rows
  if (headerRow === undefined) {
    return { leads: [], rowsWithoutEmail: [] }
  }
  const headerMap = buildHeaderMap(headerRow)
  const columnOf = (aliases: readonly string[]): number | undefined =>
    findColumn({ headerMap, aliases })
  const emailColumn = columnOf(COLUMN_ALIASES.email)
  if (emailColumn === undefined) {
    throw new Error('The Leads tab has no email column \u{2014} check its header row')
  }

  const leads = dataRows.flatMap((row, index) => {
    const email = readCell({ row, column: emailColumn })
    if (email === undefined) {
      return []
    }
    return [
      {
        rowNumber: index + HEADER_ROW_COUNT + 1,
        timestamp: readCell({ row, column: columnOf(COLUMN_ALIASES.timestamp) }),
        name: readCell({ row, column: columnOf(COLUMN_ALIASES.name) }),
        jobTitle: readCell({ row, column: columnOf(COLUMN_ALIASES.jobTitle) }),
        company: readCell({ row, column: columnOf(COLUMN_ALIASES.company) }),
        linkedIn: readCell({ row, column: columnOf(COLUMN_ALIASES.linkedIn) }),
        email: toEmailKey(email),
        phone: readCell({ row, column: columnOf(COLUMN_ALIASES.phone) }),
        city: readCell({ row, column: columnOf(COLUMN_ALIASES.city) }),
        interests: readCell({ row, column: columnOf(COLUMN_ALIASES.interests) }),
        status: parseStatus(readCell({ row, column: columnOf(COLUMN_ALIASES.status) })),
      },
    ]
  })

  const rowsWithoutEmail = dataRows.flatMap((row, index) => {
    const hasEmail = readCell({ row, column: emailColumn }) !== undefined
    if (hasEmail || !hasAnyValue(row)) {
      return []
    }
    return [
      {
        rowNumber: index + HEADER_ROW_COUNT + 1,
        name: readCell({ row, column: columnOf(COLUMN_ALIASES.name) }),
      },
    ]
  })

  return { leads, rowsWithoutEmail }
}
