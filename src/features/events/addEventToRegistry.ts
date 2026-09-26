import type { NewEvent } from './communityEvent'
import { EVENT_COLUMNS } from './eventRegistryColumns'
import { EVENTS_APPEND_RANGE, EVENTS_RANGE, EVENTS_TAB_NAME } from './eventRegistryTabs'
import { buildNewEventWrites } from './eventRegistryWrites'
import { readCell } from '../../sheets/readCell'
import type { SheetsClient } from '../../sheets/sheetsClient'

const readRecordedIds = ({
  rows,
  headerRow,
}: {
  rows: readonly (readonly string[])[]
  headerRow: readonly string[]
}): readonly string[] => {
  const idColumn = EVENT_COLUMNS.locate(headerRow).id
  return rows
    .slice(1)
    .flatMap((row) => {
      const id = readCell({ row, column: idColumn })
      return id === undefined ? [] : [id]
    })
}

/* The tab is read before the append for two reasons at once: the header row
   says where each value goes, and the ids already on it say whether this one is
   free. An id is never reused, and a collision would split one event's
   attendance across two rows without anything ever saying so. */
export const addEventToRegistry = async ({
  sheetsClient,
  event,
}: {
  sheetsClient: SheetsClient
  event: NewEvent
}): Promise<void> => {
  const rows = await sheetsClient.readRange({ range: EVENTS_RANGE })
  const headerRow = rows[0]
  if (headerRow === undefined) {
    throw new Error(
      `The ${EVENTS_TAB_NAME} tab has no header row to write under \u{2014} nothing was written.`,
    )
  }

  if (readRecordedIds({ rows, headerRow }).includes(event.id)) {
    throw new Error(
      `The ${EVENTS_TAB_NAME} tab already holds an event with the id ${event.id} \u{2014} nothing was written. Reload the events and add it again.`,
    )
  }

  /* RAW, for the same reason the edit is: the date must stay the day it names. */
  await sheetsClient.appendRow({
    range: EVENTS_APPEND_RANGE,
    values: EVENT_COLUMNS.buildRow({ headerRow, writes: buildNewEventWrites({ event }) }),
    valueInputOption: 'RAW',
  })
}
