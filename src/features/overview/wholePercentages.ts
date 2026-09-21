/* Whole percentages that still add up to 100: every share is floored first and
   the leftover points go to the shares whose fraction was cut hardest. Rounding
   each share on its own reads as a bug on the screen, where "48 / 24 / 29" is a
   split of 101% of the community.

   Every chart on the overview runs through here, so no two of them can disagree
   about how a third of something is written down. */
export const allocateWholePercentages = (counts: readonly number[]): readonly number[] => {
  const total = counts.reduce((sum, count) => sum + count, 0)
  if (total === 0) {
    return counts.map(() => 0)
  }

  const exactShares = counts.map((count, index) => ({ index, exact: (count / total) * 100 }))
  const flooredPointsUsed = exactShares.reduce((used, share) => used + Math.floor(share.exact), 0)
  /* An empty group never takes a leftover point: its fraction is 0, so sorting
     by fraction leaves it behind every group that actually lost something. */
  const indexesGettingAnExtraPoint = new Set(
    exactShares
      .filter((share) => share.exact % 1 > 0)
      .toSorted((first, second) => (second.exact % 1) - (first.exact % 1))
      .slice(0, 100 - flooredPointsUsed)
      .map((share) => share.index),
  )

  return counts.map((count, index) => {
    const extraPoint = indexesGettingAnExtraPoint.has(index) ? 1 : 0
    return Math.floor((count / total) * 100) + extraPoint
  })
}
