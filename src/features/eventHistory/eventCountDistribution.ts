import {
  doesEventCountMatch,
  EVENT_COUNT_FILTER_LABELS,
  type EventCountFilter,
} from './memberEventCounts'
import type { Member } from '../members/member'
import { buildDistribution, type Distribution } from '../overview/distribution'

/* The four answers, in the order a reader follows them: from the members to
   reach out to first to the regulars. Not sorted by size, because the order is
   the point. */
export const EVENT_COUNT_BUCKETS: readonly Exclude<EventCountFilter, 'any'>[] = [
  'none',
  'one',
  'two',
  'three-or-more',
]

/* `key` is the filter each bar opens the Members screen with. */
export const buildEventCountDistribution = ({
  members,
  counts,
}: {
  members: readonly Member[]
  counts: ReadonlyMap<number, number>
}): Distribution =>
  buildDistribution(
    EVENT_COUNT_BUCKETS.map((filter) => ({
      key: filter,
      label: EVENT_COUNT_FILTER_LABELS[filter],
      count: members.filter((member) =>
        doesEventCountMatch({ count: counts.get(member.rowNumber) ?? 0, filter }),
      ).length,
      isUnknown: false,
    })),
  )
