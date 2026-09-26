import { COLUMN_ALIASES } from '../../sheets/columnAliases'
import { toColumnIndex } from '../../sheets/columnIndex'
import { toColumnLetter } from '../../sheets/columnLetter'
import { buildHeaderMap, findColumn } from '../../sheets/headerMap'

/* The five fields a response sheet is read through, once phase two reads one.
   The order is the order they are stored and shown in, so a mapping cell reads
   the same way on every event. */
export const MAPPED_FIELDS = ['timestamp', 'name', 'email', 'company', 'jobTitle'] as const

export type MappedField = (typeof MAPPED_FIELDS)[number]

/* A field with no column is a field this sheet does not have. Five of the
   community's response sheets have no email column at all, and that is a fact
   about the sheet rather than a mapping nobody finished: it is recorded
   explicitly, so a later read knows the difference between "asked and there is
   none" and "never asked". */
export type ResponseSheetMapping = Readonly<Partial<Record<MappedField, number>>>

const ALIASES_BY_FIELD: Readonly<Record<MappedField, readonly string[]>> = {
  timestamp: COLUMN_ALIASES.timestamp,
  name: COLUMN_ALIASES.name,
  email: COLUMN_ALIASES.email,
  company: COLUMN_ALIASES.company,
  jobTitle: COLUMN_ALIASES.jobTitle,
}

type RecordedMapping = Readonly<Record<string, unknown>>

/* A guess, never a decision. `buildHeaderMap` keeps the leftmost of two columns
   sharing a heading, which makes a duplicate resolve the same way every time
   rather than the way the last read happened to fall, and it recognises no
   blank heading at all — so the column under one is left for the organiser to
   name. Nothing here is saved until they have looked at it. */
export const guessResponseSheetMapping = ({
  headerRow,
}: {
  headerRow: readonly string[]
}): ResponseSheetMapping => {
  const headerMap = buildHeaderMap(headerRow)
  return MAPPED_FIELDS.reduce<ResponseSheetMapping>((mapping, field) => {
    const columnIndex = findColumn({ headerMap, aliases: ALIASES_BY_FIELD[field] })
    if (columnIndex === undefined) {
      return mapping
    }
    return { ...mapping, [field]: columnIndex }
  }, {})
}

export const hasMappedEmail = (mapping: ResponseSheetMapping): boolean =>
  mapping.email !== undefined

/* Column letters rather than indexes, because this cell is in a spreadsheet
   somebody reads: `"email":"F"` is checkable against the column headed F, and
   `"email":5` is a number they would have to count out. An explicit `null` for
   every field the sheet does not have keeps the recorded fact readable too. */
export const recordColumnMapping = (mapping: ResponseSheetMapping): string =>
  JSON.stringify(
    Object.fromEntries(
      MAPPED_FIELDS.map((field) => {
        const columnIndex = mapping[field]
        return [field, columnIndex === undefined ? null : toColumnLetter(columnIndex)]
      }),
    ),
  )

const readRecordedMapping = (cell: string): RecordedMapping | undefined => {
  try {
    const parsed: unknown = JSON.parse(cell)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return undefined
    }
    return parsed as RecordedMapping
  } catch {
    return undefined
  }
}

/* `undefined` is a cell nobody can read, which is different from a mapping that
   names nothing: the first means the organiser should attach the sheet again,
   and the second means they looked at it and this sheet has no such columns.
   A single unreadable cell must not take the registry read down with it, so it
   comes back as a value the caller can report. */
export const parseColumnMapping = (cell: string | undefined): ResponseSheetMapping | undefined => {
  const trimmed = cell?.trim() ?? ''
  if (trimmed === '') {
    return {}
  }
  const recorded = readRecordedMapping(trimmed)
  if (recorded === undefined) {
    return undefined
  }
  return MAPPED_FIELDS.reduce<ResponseSheetMapping>((mapping, field) => {
    const letters = recorded[field]
    if (typeof letters !== 'string') {
      return mapping
    }
    const columnIndex = toColumnIndex(letters)
    if (columnIndex === undefined) {
      return mapping
    }
    return { ...mapping, [field]: columnIndex }
  }, {})
}
