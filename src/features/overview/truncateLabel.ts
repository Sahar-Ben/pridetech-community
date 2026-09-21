const ELLIPSIS = '\u{2026}'

/* SVG text does not wrap and does not know how wide it will be, so a label
   longer than its column is cut here rather than left to spill across the bars.
   Nothing is lost by it: the full label is on the tooltip and in the table
   under every chart. */
export const truncateLabel = ({
  label,
  maximumCharacters,
}: {
  label: string
  maximumCharacters: number
}): string => {
  if (label.length <= maximumCharacters) {
    return label
  }
  return `${label.slice(0, maximumCharacters - 1).trimEnd()}${ELLIPSIS}`
}
