import type { CommunityEvent } from './communityEvent'
import { readRecordedFlag } from './eventFlag'
import { EVENT_COLUMNS, type EventColumnTarget } from './eventRegistryColumns'
import { EVENTS_TAB_NAME } from './eventRegistryTabs'
import { hasAnyRecordedCell, readCell } from '../../sheets/readCell'

const HEADER_ROW_COUNT = 1

const ISO_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/

/* Two different kinds of wrong, kept apart because only one of them costs the
   organiser an event.

   A row with no `Event ID` is not listed: nothing can point at it, so an
   attendance row written against it later would belong to no event. A row
   whose date is not `YYYY-MM-DD` is listed, because it is still somebody's
   event, but the listing splits upcoming from past by comparing those strings
   and a date in any other shape lands in whichever half the comparison puts
   it. Both are handed back so the screen can say which row to go and fix. */
export type EventRowIssue =
  | { kind: 'no-id'; rowNumber: number; name: string | undefined }
  | { kind: 'unreadable-date'; rowNumber: number; recordedDate: string }

export type ParsedEvents = {
  events: readonly CommunityEvent[]
  issues: readonly EventRowIssue[]
}

type ReadRow = { rowNumber: number; row: readonly string[] }

const REQUIRED_COLUMNS: readonly EventColumnTarget[] = [
  'id',
  'name',
  'date',
  'host',
  'location',
  'isMembersOnly',
  'isClosedOut',
  'isArchived',
]

const requireHeaderRow = (rows: readonly (readonly string[])[]): readonly string[] => {
  const [headerRow] = rows
  if (headerRow === undefined) {
    throw new Error(
      `The ${EVENTS_TAB_NAME} tab came back empty \u{2014} it has no header row to read.`,
    )
  }
  const missingLabels = EVENT_COLUMNS.findMissing({ headerRow, targets: REQUIRED_COLUMNS })
  if (missingLabels.length > 0) {
    throw new Error(
      `The ${EVENTS_TAB_NAME} tab has no column headed ${missingLabels.join(' or ')} \u{2014} restore the heading in the sheet, then reload.`,
    )
  }
  return headerRow
}

const toEvent = ({
  id,
  rowNumber,
  row,
  columns,
}: {
  id: string
  rowNumber: number
  row: readonly string[]
  columns: Partial<Record<EventColumnTarget, number>>
}): CommunityEvent => {
  const cell = (target: EventColumnTarget): string | undefined =>
    readCell({ row, column: columns[target] })

  return {
    rowNumber,
    id,
    name: cell('name') ?? '',
    date: cell('date') ?? '',
    host: cell('host'),
    location: cell('location') ?? '',
    isMembersOnly: readRecordedFlag(cell('isMembersOnly')),
    isClosedOut: readRecordedFlag(cell('isClosedOut')),
    isArchived: readRecordedFlag(cell('isArchived')),
  }
}

const findDateIssue = (event: CommunityEvent): readonly EventRowIssue[] =>
  ISO_DATE_SHAPE.test(event.date)
    ? []
    : [{ kind: 'unreadable-date', rowNumber: event.rowNumber, recordedDate: event.date }]

/* Sheet order, not date order. `groupEventsForListing` splits and sorts for the
   screen; sorting twice would mean the row numbers and the listing disagreed
   about which event is which. */
export const parseEvents = ({ rows }: { rows: readonly (readonly string[])[] }): ParsedEvents => {
  const headerRow = requireHeaderRow(rows)
  const columns = EVENT_COLUMNS.locate(headerRow)

  const recordedRows: readonly ReadRow[] = rows
    .slice(HEADER_ROW_COUNT)
    .map((row, index) => ({ rowNumber: index + HEADER_ROW_COUNT + 1, row }))
    .filter(({ row }) => hasAnyRecordedCell(row))

  const events = recordedRows.flatMap(({ rowNumber, row }) => {
    const id = readCell({ row, column: columns.id })
    return id === undefined ? [] : [toEvent({ id, rowNumber, row, columns })]
  })

  const rowsWithoutId = recordedRows.flatMap(({ rowNumber, row }): readonly EventRowIssue[] =>
    readCell({ row, column: columns.id }) === undefined
      ? [{ kind: 'no-id', rowNumber, name: readCell({ row, column: columns.name }) }]
      : [],
  )

  return { events, issues: [...rowsWithoutId, ...events.flatMap(findDateIssue)] }
}
