/* Do not collapse these escapes into a range. U+200C (ZWNJ) and U+200D (ZWJ) sit
   between U+200B and U+200E and must NOT be stripped: ZWJ holds multi-codepoint
   emoji sequences together and ZWNJ is meaningful in Persian and several Indic
   scripts. Both are content; the rest are formatting artifacts. Escapes, never
   literals, so the class stays readable and survives a copy-paste. */
const invisibleFormatting =
  /[\u{00ad}\u{061c}\u{200b}\u{200e}\u{200f}\u{2060}\u{202a}-\u{202e}\u{2066}-\u{2069}\u{feff}]/gu

export const readCell = ({
  row,
  column,
}: {
  row: readonly string[]
  column: number | undefined
}): string | undefined => {
  if (column === undefined) {
    return undefined
  }
  const value = row[column]
  if (value === undefined) {
    return undefined
  }
  const cleaned = value.replace(invisibleFormatting, '').trim()
  if (cleaned === '') {
    return undefined
  }
  return cleaned
}
