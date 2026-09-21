/* Every word typed has to match somewhere, so `ro am` finds Ronit Amsalem in
   four keystrokes. At a door that is the difference between a queue moving and
   a queue waiting for someone to spell a surname. */
const toSearchWords = (searchText: string): readonly string[] =>
  searchText
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word !== '')

export const doesTextMatchSearch = ({
  text,
  searchText,
}: {
  text: string
  searchText: string
}): boolean => {
  const searchableText = text.toLowerCase()
  return toSearchWords(searchText).every((word) => searchableText.includes(word))
}
