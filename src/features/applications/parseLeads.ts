import { COLUMN_ALIASES } from '../../sheets/columnAliases'
import { toEmailKey } from '../../sheets/emailKey'
import { buildHeaderMap, findColumn } from '../../sheets/headerMap'
import { hasAnyRecordedCell, readCell } from '../../sheets/readCell'
import { RECORDED_LEAD_STATUS, type Lead, type LeadStatus } from './lead'

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

const toComparableStatus = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLowerCase()

/* Canonical on write, forgiving on read. The column is typed into by hand as
   well as written by this app, so case and stray spacing decide nothing, and a
   bare `Maybe` means what the full phrase means. Anything else is pending,
   which is the safe direction: a status nobody here recognises leaves the
   applicant in the queue rather than filed under a decision nobody took. */
const STATUS_BY_RECORDED_VALUE: ReadonlyMap<string, LeadStatus> = new Map([
  [toComparableStatus(RECORDED_LEAD_STATUS.approved), 'approved'],
  [toComparableStatus(RECORDED_LEAD_STATUS.declined), 'declined'],
  [toComparableStatus(RECORDED_LEAD_STATUS.maybe), 'maybe'],
  ['maybe', 'maybe'],
])

const parseStatus = (value: string | undefined): LeadStatus => {
  if (value === undefined) {
    return 'pending'
  }
  return STATUS_BY_RECORDED_VALUE.get(toComparableStatus(value)) ?? 'pending'
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
    if (hasEmail || !hasAnyRecordedCell(row)) {
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
