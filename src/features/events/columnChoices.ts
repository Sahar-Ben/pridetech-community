import { toColumnLetter } from '../../sheets/columnLetter'
import { readCell } from '../../sheets/readCell'

const NO_HEADING = '(no heading)'

const SEPARATOR = ' \u{2014} '

export type ColumnChoice = {
  columnIndex: number
  letter: string
  heading: string | undefined
}

/* Every column of the sheet, not only the ones with a heading. One of the real
   response sheets has a blank cell over its timestamp column, and a chooser
   built from headings alone would offer the organiser no way to say which
   column that is. The letter is what makes two columns sharing a heading tell
   themselves apart, and it is also what somebody looking at their own sheet
   sees along the top of it. */
export const buildColumnChoices = ({
  headerRow,
}: {
  headerRow: readonly string[]
}): readonly ColumnChoice[] =>
  headerRow.map((_heading, columnIndex) => ({
    columnIndex,
    letter: toColumnLetter(columnIndex),
    heading: readCell({ row: headerRow, column: columnIndex }),
  }))

export const describeColumnChoice = (choice: ColumnChoice): string =>
  `${choice.letter}${SEPARATOR}${choice.heading ?? NO_HEADING}`
