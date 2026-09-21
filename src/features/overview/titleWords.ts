/* `&` and `+` stay inside a word so `R&D` survives as one; everything else that
   is not a letter or a digit is a separator, which is what turns `Co-founder,
   CEO` into three words. Matching whole words rather than substrings is what
   stops `IT` finding itself inside `legitimate`. */
const WORD_SEPARATORS = /[^\p{Letter}\p{Number}&+]+/u

export const toTitleWords = (title: string | undefined): readonly string[] =>
  (title ?? '')
    .toLowerCase()
    .split(WORD_SEPARATORS)
    .filter((word) => word !== '')

/* Keywords are matched against the words re-joined with single spaces and
   padded at both ends, so a one-word keyword and a several-word one are the
   same lookup and neither can match half of a longer word. */
export const containsAnyKeyword = ({
  words,
  keywords,
}: {
  words: readonly string[]
  keywords: readonly string[]
}): boolean => {
  if (words.length === 0) {
    return false
  }
  const paddedTitle = ` ${words.join(' ')} `
  return keywords.some((keyword) => paddedTitle.includes(` ${keyword} `))
}
