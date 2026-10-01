/* The two letters on an avatar tile: the first letter of the first two words,
   upper-cased. An email address used as a name gives its own first letter. */
export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter((word) => word !== '')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
