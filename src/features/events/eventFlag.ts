/* `Yes` and `No` rather than `TRUE` and a blank. Three of these columns are
   read at a glance by somebody scrolling the tab, and a blank cell cannot be
   told apart from a column nobody has filled in yet. */
const RECORDED_YES = 'Yes'

const RECORDED_NO = 'No'

/* Everything an organiser plausibly types to mean yes, including the tick a
   spreadsheet offers and the `TRUE` a checkbox column produces. Anything else
   reads as not set: a cell holding a sentence is not a flag, and guessing at
   one would archive an event nobody archived. */
const RECORDED_YES_VALUES: readonly string[] = ['yes', 'y', 'true', 'x', '1', '\u{2713}']

export const toRecordedFlag = (isSet: boolean): string => (isSet ? RECORDED_YES : RECORDED_NO)

export const readRecordedFlag = (cell: string | undefined): boolean =>
  cell !== undefined && RECORDED_YES_VALUES.includes(cell.trim().toLowerCase())
