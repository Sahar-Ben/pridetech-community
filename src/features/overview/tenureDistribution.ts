import { buildEarliestApplicationIndex } from './applicationDates'
import { buildDistribution, type BucketTally, type Distribution } from './distribution'
import { TENURE_BUCKETS, toTenureBucketKey, UNKNOWN_TENURE_BUCKET } from './tenure'
import type { Lead } from '../applications/lead'
import { listMemberEmails, type Member } from '../members/member'
import { toEmailKey } from '../../sheets/emailKey'

const EMPTY_TALLIES: readonly BucketTally[] = [
  ...TENURE_BUCKETS.map((band) => ({
    key: band.key,
    label: band.label,
    count: 0,
    isUnknown: false,
  })),
  { key: UNKNOWN_TENURE_BUCKET.key, label: UNKNOWN_TENURE_BUCKET.label, count: 0, isUnknown: true },
]

const toBucketKey = ({
  member,
  earliestApplicationByEmail,
  asOf,
}: {
  member: Member
  earliestApplicationByEmail: ReadonlyMap<string, Date>
  asOf: Date
}): string => {
  /* The earliest application under any of their addresses: somebody who
     applied from one and registers for events from another joined when the
     first one did. */
  const applicationDates = listMemberEmails(member).flatMap((email) => {
    const appliedAt = earliestApplicationByEmail.get(toEmailKey(email))
    return appliedAt === undefined ? [] : [appliedAt]
  })
  if (listMemberEmails(member).length === 0) {
    return UNKNOWN_TENURE_BUCKET.key
  }
  const appliedAt = applicationDates.reduce<Date | undefined>(
    (earliest, date) => (earliest === undefined || date < earliest ? date : earliest),
    undefined,
  )
  return toTenureBucketKey({ appliedAt, asOf })
}

/* Derived rather than measured: `Approved at` is blank on every row of the
   Members tab, so a member's tenure is their earliest application on the Leads
   tab, matched on the address. Members added to the sheet by hand have no
   application to match and are banded as such rather than dropped — which is
   also why the bands are left in time order instead of sorted by size: a
   reader follows them left to right as a timeline. */
export const buildTenureDistribution = ({
  members,
  leads,
  asOf,
}: {
  members: readonly Member[]
  leads: readonly Lead[]
  asOf: Date
}): Distribution => {
  const earliestApplicationByEmail = buildEarliestApplicationIndex(leads)
  const countsByKey = members.reduce((counts, member) => {
    const key = toBucketKey({ member, earliestApplicationByEmail, asOf })
    counts.set(key, (counts.get(key) ?? 0) + 1)
    return counts
  }, new Map<string, number>())

  return buildDistribution(
    EMPTY_TALLIES.map((tally) => ({ ...tally, count: countsByKey.get(tally.key) ?? 0 })),
  )
}
