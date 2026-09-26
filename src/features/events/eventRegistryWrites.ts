import type { CommunityEvent, NewEvent } from './communityEvent'
import { readRecordedFlag, toRecordedFlag } from './eventFlag'
import { EVENT_COLUMNS, type EventColumnTarget } from './eventRegistryColumns'
import type { SheetColumnWrite } from '../../sheets/sheetColumns'

export type EventCellWrite = SheetColumnWrite<EventColumnTarget>

type TextColumn = {
  target: EventColumnTarget
  readValue: (event: NewEvent) => string | undefined
}

type FlagColumn = {
  target: EventColumnTarget
  readValue: (event: NewEvent) => boolean
}

/* `id` is absent, and that is the whole of why an event survives being renamed,
   moved and rescheduled: it is written once, when the row is appended, and
   never again. `Capacity` and `Notes` are absent because this app does not read
   them, so nothing it writes can disturb what somebody typed there. */
const TEXT_COLUMNS: readonly TextColumn[] = [
  { target: 'name', readValue: (event) => event.name },
  { target: 'date', readValue: (event) => event.date },
  { target: 'host', readValue: (event) => event.host },
  { target: 'location', readValue: (event) => event.location },
]

const FLAG_COLUMNS: readonly FlagColumn[] = [
  { target: 'isMembersOnly', readValue: (event) => event.isMembersOnly },
  { target: 'isClosedOut', readValue: (event) => event.isClosedOut },
  { target: 'isArchived', readValue: (event) => event.isArchived },
]

/* Two questions, and a cell is written only if both say yes — the same
   discipline the members directory writes under.

   Did the organiser change this field? A field they never touched is left
   alone whatever the cell holds.

   Does the cell still disagree? If another organiser has already made the same
   change, there is nothing left to write, and every rewrite of a cell that
   already says the right thing is a round trip that can only lose something.

   A flag is compared as the flag it means rather than as the text in the cell,
   because a blank cell means No: comparing text would write `No` into every
   untouched flag the first time anybody edited anything. */
export const buildEventEditWrites = ({
  originalEvent,
  updatedEvent,
  headerRow,
  existingRow,
}: {
  originalEvent: CommunityEvent
  updatedEvent: CommunityEvent
  headerRow: readonly string[]
  existingRow: readonly string[]
}): readonly EventCellWrite[] => {
  const recorded = (target: EventColumnTarget): string | undefined =>
    EVENT_COLUMNS.readCell({ headerRow, row: existingRow, target })

  const changedText = ({ target, readValue }: TextColumn): readonly EventCellWrite[] => {
    const value = readValue(updatedEvent) ?? ''
    if (value === (readValue(originalEvent) ?? '') || value === (recorded(target) ?? '')) {
      return []
    }
    return [{ target, value }]
  }

  const changedFlag = ({ target, readValue }: FlagColumn): readonly EventCellWrite[] => {
    const isSet = readValue(updatedEvent)
    if (isSet === readValue(originalEvent) || isSet === readRecordedFlag(recorded(target))) {
      return []
    }
    return [{ target, value: toRecordedFlag(isSet) }]
  }

  return [...TEXT_COLUMNS.flatMap(changedText), ...FLAG_COLUMNS.flatMap(changedFlag)]
}

/* An appended row is the one write that states every cell, because the row does
   not exist yet and there is nothing in it to preserve. The flags are written
   as `No` rather than left blank so the row reads the same as one this app has
   since edited. */
export const buildNewEventWrites = ({
  event,
}: {
  event: NewEvent
}): readonly EventCellWrite[] => [
  { target: 'id', value: event.id },
  ...TEXT_COLUMNS.map(({ target, readValue }) => ({ target, value: readValue(event) ?? '' })),
  ...FLAG_COLUMNS.map(({ target, readValue }) => ({
    target,
    value: toRecordedFlag(readValue(event)),
  })),
]
