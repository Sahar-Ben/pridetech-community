import type { DistributionBucket } from './distribution'

const LABELLED_BAR_COUNT = 5

/* The five biggest bars carry their number on the chart and the rest give it up
   on hover, which is what a reader asked for after living with a number on
   every row.

   Every unknown bucket is labelled as well, whatever it ranks, and it does not
   spend one of the five. A chart where "we could not tell" is the one bar
   without a figure beside it would be misleading in the one direction that
   matters here, and it is usually not in the top five precisely when it most
   needs saying.

   The cut is pulled back rather than allowed to fall inside a tie: ten
   companies with two members each, four of them labelled, reads as though the
   labelled ones were somehow larger. Pulling back to four bars of two says
   what is true. */
const withoutASplitTie = ({
  chosen,
  ranked,
}: {
  chosen: readonly DistributionBucket[]
  ranked: readonly DistributionBucket[]
}): readonly DistributionBucket[] => {
  const nextOut = ranked[chosen.length]
  if (nextOut === undefined) {
    return chosen
  }
  const kept = chosen.filter((bucket) => bucket.count !== nextOut.count)
  /* Every bar the same size is the one case where pulling back would leave the
     chart with no figures at all, so the cut stands. */
  return kept.length === 0 ? chosen : kept
}

export const toLabelledBarKeys = (
  buckets: readonly DistributionBucket[],
): ReadonlySet<string> => {
  const ranked = buckets
    .filter((bucket) => !bucket.isUnknown)
    .toSorted((first, second) => {
      if (first.count !== second.count) {
        return second.count - first.count
      }
      return first.label.toLowerCase().localeCompare(second.label.toLowerCase())
    })

  const biggest = withoutASplitTie({ chosen: ranked.slice(0, LABELLED_BAR_COUNT), ranked })

  return new Set(
    [...biggest, ...buckets.filter((bucket) => bucket.isUnknown)].map((bucket) => bucket.key),
  )
}
