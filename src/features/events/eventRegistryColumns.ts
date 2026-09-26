import { EVENTS_TAB_NAME } from './eventRegistryTabs'
import { createSheetColumns, type SheetColumnDefinition } from '../../sheets/sheetColumns'

/* Not in `COLUMN_ALIASES`. That list exists to reconcile the many spellings the
   community's Google Forms have used for one question over two years. This tab
   is created by this app with one spelling per column, and `buildHeaderMap`
   already forgives case and spacing, so a second spelling here would only be a
   way for two different columns to answer to the same heading. */
const EVENT_COLUMN_DEFINITIONS = {
  id: { label: 'Event ID', aliases: ['event id'] },
  name: { label: 'Name', aliases: ['name'] },
  date: { label: 'Date', aliases: ['date'] },
  host: { label: 'Host', aliases: ['host'] },
  location: { label: 'Location', aliases: ['location'] },
  isMembersOnly: { label: 'Members only', aliases: ['members only'] },
  isClosedOut: { label: 'Closed out', aliases: ['closed out'] },
  isArchived: { label: 'Archived', aliases: ['archived'] },
} as const satisfies Record<string, SheetColumnDefinition>

export type EventColumnTarget = keyof typeof EVENT_COLUMN_DEFINITIONS

/* `Capacity` and `Notes` are absent on purpose: the setup creates them and this
   app never reads or writes them, so a value typed into either stays exactly
   as it was typed. */
export const EVENT_COLUMNS = createSheetColumns<EventColumnTarget>({
  tabName: EVENTS_TAB_NAME,
  columns: EVENT_COLUMN_DEFINITIONS,
})
