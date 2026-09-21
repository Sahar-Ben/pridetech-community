import { COLUMN_ALIASES } from '../../sheets/columnAliases'
import { buildHeaderMap, findColumn } from '../../sheets/headerMap'
import { readCell } from '../../sheets/readCell'
import type { Lead, LeadStatus } from './lead'

const HEADER_ROW_COUNT = 1

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

export const parseLeads = ({ rows }: { rows: readonly (readonly string[])[] }): Lead[] => {
  const [headerRow, ...dataRows] = rows
  if (headerRow === undefined) {
    return []
  }
  const headerMap = buildHeaderMap(headerRow)
  const columnOf = (aliases: readonly string[]): number | undefined =>
    findColumn({ headerMap, aliases })
  const emailColumn = columnOf(COLUMN_ALIASES.email)
  if (emailColumn === undefined) {
    throw new Error('The Leads tab has no email column \u{2014} check its header row')
  }

  return dataRows.flatMap((row, index) => {
    const email = readCell({ row, column: emailColumn })
    if (email === undefined) {
      return []
    }
    return [
      {
        rowNumber: index + HEADER_ROW_COUNT + 1,
        name: readCell({ row, column: columnOf(COLUMN_ALIASES.name) }),
        jobTitle: readCell({ row, column: columnOf(COLUMN_ALIASES.jobTitle) }),
        company: readCell({ row, column: columnOf(COLUMN_ALIASES.company) }),
        linkedIn: readCell({ row, column: columnOf(COLUMN_ALIASES.linkedIn) }),
        email: email.toLowerCase(),
        phone: readCell({ row, column: columnOf(COLUMN_ALIASES.phone) }),
        city: readCell({ row, column: columnOf(COLUMN_ALIASES.city) }),
        interests: readCell({ row, column: columnOf(COLUMN_ALIASES.interests) }),
        status: parseStatus(readCell({ row, column: columnOf(COLUMN_ALIASES.status) })),
      },
    ]
  })
}
