const ALPHABET_LENGTH = 26
const LETTER_A = 'A'.charCodeAt(0)

const COLUMN_LETTERS = /^[A-Za-z]+$/

/* The inverse of `toColumnLetter`, and bijective base-26 for the same reason:
   a column mapping is stored in the sheet as the letter an organiser can see in
   their own column header, and reading `AA` as 26 would map every field on a
   wide response sheet one column to the left.

   A reference this cannot read comes back as `undefined` rather than throwing:
   the mappings it reads are cells in a hand-maintained tab, and one typo there
   must not take the whole registry read down with it. */
export const toColumnIndex = (columnLetters: string): number | undefined => {
  if (!COLUMN_LETTERS.test(columnLetters)) {
    return undefined
  }
  return (
    [...columnLetters.toUpperCase()].reduce(
      (index, letter) => index * ALPHABET_LENGTH + (letter.charCodeAt(0) - LETTER_A) + 1,
      0,
    ) - 1
  )
}
