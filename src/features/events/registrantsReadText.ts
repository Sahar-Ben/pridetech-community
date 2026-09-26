import type { EventRegistrantsRead, SheetReadProblem } from './loadEventRegistrants'

const pluralise = ({ count, one, many }: { count: number; one: string; many: string }): string =>
  `${count} ${count === 1 ? one : many}`

export const describeReadingSheets = (sheetCount: number): string =>
  `Reading registrants from ${pluralise({ count: sheetCount, one: 'response sheet', many: 'response sheets' })}\u{2026}`

/* Each problem names the tab by name, because an event can have two and the
   organiser needs to know which one is missing from the list below. */
export const describeSheetReadProblem = (problem: SheetReadProblem): string => {
  const sheetName = `"${problem.sheet.sheetName}"`
  if (problem.kind === 'no-access') {
    return `${sheetName} could not be opened. Google only lets this app read files you have picked yourself, so if somebody else attached it, give access below by picking the same file. If the file was deleted, attach its replacement.`
  }
  if (problem.kind === 'unreadable-mapping') {
    return `${sheetName} was not read: its column mapping in the Event sheets tab could not be read. Attach the sheet again to replace it.`
  }
  return `${sheetName} could not be read. ${problem.message}`
}

/* The notes about rows that were read with a caveat. Neither is a failure:
   the list is right, and these say why it is shorter than the sheet. */
export const describeReadNotes = (read: EventRegistrantsRead): readonly string[] => [
  ...(read.repeatedCount > 0
    ? [
        `${pluralise({ count: read.repeatedCount, one: 'repeat submission', many: 'repeat submissions' })} with an email already on the list ${read.repeatedCount === 1 ? 'was' : 'were'} counted once.`,
      ]
    : []),
  ...read.rowsWithoutNameOrEmail.map(
    ({ sheet, rowNumbers }) =>
      `${rowNumbers.length === 1 ? 'Row' : 'Rows'} ${rowNumbers.join(', ')} of "${sheet.sheetName}" ${rowNumbers.length === 1 ? 'has' : 'have'} neither a name nor an email, so ${rowNumbers.length === 1 ? 'it is' : 'they are'} left out.`,
  ),
]
