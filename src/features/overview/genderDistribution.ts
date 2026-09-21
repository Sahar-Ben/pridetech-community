import { buildDistribution, type Distribution } from './distribution'
import type { Member } from '../members/member'

/* Fixed order, never sorted by size: this is the one chart on the overview
   drawn as a pie, and a pie whose slices reorder between reads is unreadable.
   `Not recorded` is last so the two recorded slices stay adjacent. */
export const buildGenderDistribution = (members: readonly Member[]): Distribution => {
  const womenCount = members.filter((member) => member.gender === 'F').length
  const menCount = members.filter((member) => member.gender === 'M').length

  return buildDistribution([
    { key: 'women', label: 'Women', count: womenCount, isUnknown: false },
    { key: 'men', label: 'Men', count: menCount, isUnknown: false },
    {
      key: 'unrecorded',
      label: 'Not recorded',
      count: members.length - womenCount - menCount,
      isUnknown: true,
    },
  ])
}
