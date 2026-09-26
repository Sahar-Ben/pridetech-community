import type { CommunityEvent } from './communityEvent'
import { EVENT_COLUMNS } from './eventRegistryColumns'
import { buildEventEditWrites } from './eventRegistryWrites'
import { readVerifiedEventRow } from './readVerifiedEventRow'
import type { SheetsClient } from '../../sheets/sheetsClient'

/* One request for the whole change, and RAW for all of it.

   RAW because there is nothing here the spreadsheet should re-read. A date is
   the field that decides it: `USER_ENTERED` would turn `2026-10-15` into a date
   value, and the next FORMATTED_VALUE read would hand back whatever the
   spreadsheet's own locale makes of that day — which the listing, which splits
   upcoming from past by comparing those strings, cannot read at all.

   One request because these cells are one event. Two requests can fail between
   them and leave a row that is half the event the organiser found and half the
   one they meant to save.

   Archiving and closing out come through here too: both are one flag on this
   row, and routing them through the same verified write is what keeps either
   from landing on an event that has since moved. */
export const saveEventToRegistry = async ({
  sheetsClient,
  originalEvent,
  updatedEvent,
}: {
  sheetsClient: SheetsClient
  originalEvent: CommunityEvent
  updatedEvent: CommunityEvent
}): Promise<void> => {
  const { headerRow, existingRow } = await readVerifiedEventRow({
    sheetsClient,
    expectedEvent: originalEvent,
  })

  const writes = buildEventEditWrites({ originalEvent, updatedEvent, headerRow, existingRow })
  if (writes.length === 0) {
    return
  }

  await sheetsClient.updateCells({
    writes: EVENT_COLUMNS.buildCellWrites({
      headerRow,
      rowNumber: originalEvent.rowNumber,
      writes,
    }),
    valueInputOption: 'RAW',
  })
}
