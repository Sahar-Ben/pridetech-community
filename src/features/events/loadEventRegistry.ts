import type { CommunityEvent } from './communityEvent'
import { EVENTS_RANGE, EVENTS_TAB_NAME, EVENT_SHEETS_RANGE, EVENT_SHEETS_TAB_NAME } from './eventRegistryTabs'
import {
  parseAttachedSheets,
  type AttachedResponseSheet,
  type AttachedSheetIssue,
} from './parseAttachedSheets'
import { parseEvents, type EventRowIssue } from './parseEventRegistry'
import { readTabRows } from '../../sheets/readTabRows'
import type { SheetsClient } from '../../sheets/sheetsClient'

export type EventRegistry = {
  events: readonly CommunityEvent[]
  eventIssues: readonly EventRowIssue[]
  attachedSheets: readonly AttachedResponseSheet[]
  attachedSheetIssues: readonly AttachedSheetIssue[]
}

/* Both tabs together, and either failing fails the load. An events list shown
   from a successful Events read while the Event sheets read failed would show
   every event as having no response sheet attached, which is a sentence this
   screen is entitled to say and would be saying falsely. */
export const loadEventRegistry = async ({
  sheetsClient,
}: {
  sheetsClient: SheetsClient
}): Promise<EventRegistry> => {
  const [eventRows, attachedRows] = await Promise.all([
    readTabRows({ sheetsClient, range: EVENTS_RANGE, tabName: EVENTS_TAB_NAME }),
    readTabRows({ sheetsClient, range: EVENT_SHEETS_RANGE, tabName: EVENT_SHEETS_TAB_NAME }),
  ])

  const parsedEvents = parseEvents({ rows: eventRows })
  const parsedSheets = parseAttachedSheets({ rows: attachedRows })

  return {
    events: parsedEvents.events,
    eventIssues: parsedEvents.issues,
    attachedSheets: parsedSheets.sheets,
    attachedSheetIssues: parsedSheets.issues,
  }
}
