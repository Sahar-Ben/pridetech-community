import type { Member } from './member'

const GENDER_GROUPS = ['women', 'men', 'unrecorded'] as const

type GenderGroup = (typeof GENDER_GROUPS)[number]

type GenderGroupNumbers = Readonly<Record<GenderGroup, number>>

export type GenderSplit = {
  total: number
  womenCount: number
  menCount: number
  unrecordedCount: number
  womenPercentage: number
  menPercentage: number
  unrecordedPercentage: number
}

const NO_PERCENTAGES: GenderGroupNumbers = { women: 0, men: 0, unrecorded: 0 }

/* Whole percentages that still add up to 100: every group is floored first and
   the leftover points go to the groups whose fraction was cut hardest. Rounding
   each group on its own reads as a bug on the screen, where "48 / 24 / 29" is a
   split of 101% of the community. */
const allocateWholePercentages = ({
  counts,
  total,
}: {
  counts: GenderGroupNumbers
  total: number
}): GenderGroupNumbers => {
  if (total === 0) {
    return NO_PERCENTAGES
  }

  const exactShares = GENDER_GROUPS.map((group) => ({
    group,
    exact: (counts[group] / total) * 100,
  }))
  const flooredPointsUsed = exactShares.reduce((used, share) => used + Math.floor(share.exact), 0)
  const groupsGettingAnExtraPoint = exactShares
    .toSorted((first, second) => (second.exact % 1) - (first.exact % 1))
    .slice(0, 100 - flooredPointsUsed)
    .map((share) => share.group)

  const percentageFor = (group: GenderGroup): number => {
    const extraPoint = groupsGettingAnExtraPoint.includes(group) ? 1 : 0
    return Math.floor((counts[group] / total) * 100) + extraPoint
  }

  return {
    women: percentageFor('women'),
    men: percentageFor('men'),
    unrecorded: percentageFor('unrecorded'),
  }
}

/* Gender is typed by hand during approval, so the unrecorded group is reported
   as its own share rather than folded into a denominator of known genders: a
   women's percentage that silently dropped the blanks would read far too high. */
export const calculateGenderSplit = (members: readonly Member[]): GenderSplit => {
  const total = members.length
  const womenCount = members.filter((member) => member.gender === 'F').length
  const menCount = members.filter((member) => member.gender === 'M').length
  const unrecordedCount = total - womenCount - menCount
  const percentages = allocateWholePercentages({
    counts: { women: womenCount, men: menCount, unrecorded: unrecordedCount },
    total,
  })

  return {
    total,
    womenCount,
    menCount,
    unrecordedCount,
    womenPercentage: percentages.women,
    menPercentage: percentages.men,
    unrecordedPercentage: percentages.unrecorded,
  }
}
