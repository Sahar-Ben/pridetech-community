/* Measured rather than rendered: SVG text cannot be asked how wide it will be
   before it is drawn, and a label that turned out not to fit would be clipped
   by its own bar. The figure is the semibold 11px value face at its widest
   glyph, so the estimate errs towards moving a label out rather than cropping
   it. */
const CHARACTER_WIDTH = 6.6

const INSIDE_PADDING = 8

const OUTSIDE_GAP = 8

/* A number crammed into a stub of a bar is worse than one sitting beside it,
   even when the arithmetic says it fits. */
const SHORTEST_BAR_THAT_CAN_HOLD_A_LABEL = 44

export type BarValueLabel = {
  showsShare: boolean
  isInside: boolean
}

/* Built from whatever count it is handed rather than from the bucket, so the
   counting-up label and the settled one are the same sentence and cannot drift
   apart in wording. */
export const toBarValueText = ({
  count,
  percentage,
  showsShare,
}: {
  count: number
  percentage: number
  showsShare: boolean
}): string => (showsShare ? `${count} (${percentage}%)` : `${count}`)

const widthOf = (text: string): number => text.length * CHARACTER_WIDTH

/* Every bar is labelled, which is a deliberate departure from labelling
   selectively: that rule is about dense forms where a number per point becomes
   noise, and a ranking of ten rows is the opposite case \u{2014} the number at the
   end of the bar is what the reader came for.

   Inside the bar when it fits, outside when it does not, and the two positions
   wear different ink, because white on the fill and ink on the panel are
   different contrast ratios. */
export const toBarValueLabel = ({
  count,
  percentage,
  barLength,
  valueColumnWidth,
}: {
  count: number
  percentage: number
  barLength: number
  valueColumnWidth: number
}): BarValueLabel => {
  const withShare = `${count} (${percentage}%)`
  const countOnly = `${count}`
  const insideBudget =
    barLength < SHORTEST_BAR_THAT_CAN_HOLD_A_LABEL ? 0 : barLength - INSIDE_PADDING * 2

  if (widthOf(withShare) <= insideBudget) {
    return { showsShare: true, isInside: true }
  }
  if (widthOf(countOnly) <= insideBudget) {
    return { showsShare: false, isInside: true }
  }
  return { showsShare: widthOf(withShare) <= valueColumnWidth - OUTSIDE_GAP, isInside: false }
}
