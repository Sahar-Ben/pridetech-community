import {
  classifyPosition,
  NO_TITLE_POSITION,
  POSITION_CATEGORIES,
  UNCLASSIFIED_POSITION,
  type TitleCategory,
} from './classifyPosition'
import {
  classifySeniority,
  NO_LEVEL_SENIORITY,
  NO_TITLE_SENIORITY,
  SENIORITY_LEVELS,
} from './classifySeniority'
import {
  buildDistribution,
  sortTalliesByCount,
  type BucketTally,
  type Distribution,
} from './distribution'
import type { Member } from '../members/member'

const UNKNOWN_KEYS: readonly string[] = [
  NO_TITLE_POSITION.key,
  UNCLASSIFIED_POSITION.key,
  NO_LEVEL_SENIORITY.key,
]

const tallyBy = ({
  members,
  classify,
  categories,
}: {
  members: readonly Member[]
  classify: (title: string | undefined) => TitleCategory
  categories: readonly TitleCategory[]
}): readonly BucketTally[] => {
  const countsByKey = members.reduce((counts, member) => {
    const key = classify(member.title).key
    counts.set(key, (counts.get(key) ?? 0) + 1)
    return counts
  }, new Map<string, number>())

  return categories.map((category) => ({
    key: category.key,
    label: category.label,
    count: countsByKey.get(category.key) ?? 0,
    isUnknown: UNKNOWN_KEYS.includes(category.key),
  }))
}

/* Disciplines are nominal \u{2014} nothing about Product comes before Engineering \u{2014}
   so they are ordered by size, which is the comparison the chart is for. The
   two "we could not read this" buckets are pinned last by `sortTalliesByCount`
   however large they grow, because they are not disciplines. */
export const buildPositionDistribution = (members: readonly Member[]): Distribution =>
  buildDistribution(
    sortTalliesByCount(
      tallyBy({
        members,
        classify: classifyPosition,
        categories: [...POSITION_CATEGORIES, NO_TITLE_POSITION, UNCLASSIFIED_POSITION],
      }),
    ),
  )

/* Seniority is a ladder, so it is left in ladder order and empty rungs are kept:
   sorting these by size would throw away the only thing that makes the chart
   readable, and hiding an empty rung would hide that nobody is on it. */
export const buildSeniorityDistribution = (members: readonly Member[]): Distribution =>
  buildDistribution(
    tallyBy({
      members,
      classify: classifySeniority,
      categories: [...SENIORITY_LEVELS, NO_LEVEL_SENIORITY, NO_TITLE_SENIORITY],
    }),
  )
