import { toColumnLetter } from './columnLetter'

export const buildCellRange = ({
  tabName,
  columnIndex,
  rowNumber,
}: {
  tabName: string
  columnIndex: number
  rowNumber: number
}): string => `${tabName}!${toColumnLetter(columnIndex)}${rowNumber}`
