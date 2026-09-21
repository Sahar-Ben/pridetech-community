const ALPHABET_LENGTH = 26
const LETTER_A = 'A'.charCodeAt(0)

/* Bijective base-26, not plain base-26: there is no zero digit in A1 notation, so
   column 26 is AA and not A@. Every write here addresses a cell by letter, and an
   off-by-one letter lands the write on the wrong column of the right row. */
export const toColumnLetter = (columnIndex: number): string => {
  if (!Number.isInteger(columnIndex) || columnIndex < 0) {
    throw new Error(`A column index must be a whole number from 0, not ${columnIndex}`)
  }
  let remaining = columnIndex
  let letters = ''
  while (remaining >= 0) {
    letters = String.fromCharCode(LETTER_A + (remaining % ALPHABET_LENGTH)) + letters
    remaining = Math.floor(remaining / ALPHABET_LENGTH) - 1
  }
  return letters
}
