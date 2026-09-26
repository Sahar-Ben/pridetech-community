import { toColumnLetter } from './columnLetter'
import { toRangeTabName } from './rangeTabName'

export const buildCellRange = ({
  tabName,
  columnIndex,
  rowNumber,
}: {
  tabName: string
  columnIndex: number
  rowNumber: number
}): string => `${toRangeTabName(tabName)}!${toColumnLetter(columnIndex)}${rowNumber}`
