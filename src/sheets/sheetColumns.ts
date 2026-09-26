import { buildCellRange } from './a1Range'
import { buildHeaderMap, findColumn, type HeaderMap } from './headerMap'
import { readCell } from './readCell'
import type { CellWrite } from './sheetsClient'

/* The label is what somebody will go looking for in their own header row, so it
   is the wording the tab uses rather than the key this code addresses it by.
   The aliases are shared between the read and the write of one column, because
   a tab that reads correctly and writes into a different column is the failure
   this indirection exists to prevent. */
export type SheetColumnDefinition = {
  label: string
  aliases: readonly string[]
}

export type SheetColumnWrite<Target extends string> = {
  target: Target
  value: string
}

export type SheetColumns<Target extends string> = {
  targets: readonly Target[]
  labelOf: (target: Target) => string
  locate: (headerRow: readonly string[]) => Partial<Record<Target, number>>
  findMissing: (options: {
    headerRow: readonly string[]
    targets: readonly Target[]
  }) => readonly string[]
  readCell: (options: {
    headerRow: readonly string[]
    row: readonly string[]
    target: Target
  }) => string | undefined
  buildCellWrites: (options: {
    headerRow: readonly string[]
    rowNumber: number
    writes: readonly SheetColumnWrite<Target>[]
  }) => readonly CellWrite[]
  buildRow: (options: {
    headerRow: readonly string[]
    writes: readonly SheetColumnWrite<Target>[]
  }) => string[]
}

type LocatedWrite = {
  columnIndex: number
  value: string
}

/* One tab's columns, resolved by heading rather than by position, built once
   per tab. Every tab in this spreadsheet gained its columns by hand over two
   years, so a position is a guess and a heading is a fact. */
export const createSheetColumns = <Target extends string>({
  tabName,
  columns,
}: {
  tabName: string
  columns: Readonly<Record<Target, SheetColumnDefinition>>
}): SheetColumns<Target> => {
  const targets: readonly Target[] = Object.keys(columns).filter(
    (key): key is Target => key in columns,
  )

  const labelOf = (target: Target): string => columns[target].label

  const columnOf = ({
    headerMap,
    target,
  }: {
    headerMap: HeaderMap
    target: Target
  }): number | undefined => findColumn({ headerMap, aliases: columns[target].aliases })

  /* Every requested column is resolved before a single value is placed, and a
     column that resolves to nothing stops the whole write. Skipping the missing
     one would write a row that is quietly missing the field somebody asked to
     change, and say nothing about it. */
  const locateWrites = ({
    headerRow,
    writes,
  }: {
    headerRow: readonly string[]
    writes: readonly SheetColumnWrite<Target>[]
  }): readonly LocatedWrite[] => {
    const headerMap = buildHeaderMap(headerRow)
    const located = writes.map((write) => ({
      write,
      columnIndex: columnOf({ headerMap, target: write.target }),
    }))
    const missingLabels = located
      .filter(({ columnIndex }) => columnIndex === undefined)
      .map(({ write }) => labelOf(write.target))

    if (missingLabels.length > 0) {
      throw new Error(
        `The ${tabName} tab has no column headed ${missingLabels.join(' or ')} \u{2014} nothing was written. Restore the heading in the sheet, then reload.`,
      )
    }

    return located.flatMap(({ write, columnIndex }) =>
      columnIndex === undefined ? [] : [{ columnIndex, value: write.value }],
    )
  }

  return {
    targets,
    labelOf,

    locate: (headerRow) => {
      const headerMap = buildHeaderMap(headerRow)
      return targets.reduce<Partial<Record<Target, number>>>((located, target) => {
        const columnIndex = columnOf({ headerMap, target })
        if (columnIndex === undefined) {
          return located
        }
        return { ...located, [target]: columnIndex }
      }, {})
    },

    findMissing: ({ headerRow, targets: wanted }) => {
      const headerMap = buildHeaderMap(headerRow)
      return wanted.flatMap((target) =>
        columnOf({ headerMap, target }) === undefined ? [labelOf(target)] : [],
      )
    },

    readCell: ({ headerRow, row, target }) =>
      readCell({ row, column: columnOf({ headerMap: buildHeaderMap(headerRow), target }) }),

    /* Each cell as its own single-cell range. A span would carry the cells
       between them along with it, and those cells are somebody else's columns. */
    buildCellWrites: ({ headerRow, rowNumber, writes }) =>
      locateWrites({ headerRow, writes }).map(({ columnIndex, value }) => ({
        range: buildCellRange({ tabName, columnIndex, rowNumber }),
        value,
      })),

    /* Appending is the one write that composes a whole row, because the row does
       not exist yet and there is nothing in it to preserve. */
    buildRow: ({ headerRow, writes }) => {
      const located = locateWrites({ headerRow, writes })
      const valueByColumn = new Map(located.map(({ columnIndex, value }) => [columnIndex, value]))
      const width = Math.max(headerRow.length, ...located.map(({ columnIndex }) => columnIndex + 1))
      return Array.from(
        { length: width },
        (_cell, columnIndex) => valueByColumn.get(columnIndex) ?? '',
      )
    },
  }
}
