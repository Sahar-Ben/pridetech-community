import { allocateWholePercentages } from './wholePercentages'

/* `isUnknown` is the whole point of this shape. Every chart on the overview has
   a bucket meaning "the sheet does not say" \u{2014} a blank gender, a member with no
   application to date from, a title no rule recognised \u{2014} and each of them is
   carried through to the screen as its own share instead of quietly leaving the
   denominator. A distribution that drops what it could not read is a lie told
   with real numbers. */
export type BucketTally = {
  key: string
  label: string
  count: number
  isUnknown: boolean
}

export type DistributionBucket = BucketTally & {
  percentage: number
}

export type Distribution = {
  buckets: readonly DistributionBucket[]
  total: number
  unknownCount: number
  unknownPercentage: number
}

export const buildDistribution = (tallies: readonly BucketTally[]): Distribution => {
  const percentages = allocateWholePercentages(tallies.map((tally) => tally.count))
  const buckets = tallies.map((tally, index) => ({
    ...tally,
    percentage: percentages[index] ?? 0,
  }))
  const unknownBuckets = buckets.filter((bucket) => bucket.isUnknown)

  return {
    buckets,
    total: tallies.reduce((sum, tally) => sum + tally.count, 0),
    unknownCount: unknownBuckets.reduce((sum, bucket) => sum + bucket.count, 0),
    unknownPercentage: unknownBuckets.reduce((sum, bucket) => sum + bucket.percentage, 0),
  }
}

const byLabel = (first: BucketTally, second: BucketTally): number =>
  first.label.toLowerCase().localeCompare(second.label.toLowerCase())

/* Magnitude order for the bar charts, with two rules that are not magnitude: an
   unknown bucket is pinned last however large it grows, because it is not a
   category competing with the others, and a tie falls back to the label so the
   same sheet never draws two different charts. */
export const sortTalliesByCount = (tallies: readonly BucketTally[]): readonly BucketTally[] =>
  tallies
    .filter((tally) => tally.count > 0)
    .toSorted((first, second) => {
      if (first.isUnknown !== second.isUnknown) {
        return first.isUnknown ? 1 : -1
      }
      if (first.count !== second.count) {
        return second.count - first.count
      }
      return byLabel(first, second)
    })
