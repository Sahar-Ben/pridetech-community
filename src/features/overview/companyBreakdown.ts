import { groupMembersByCompany } from './companyGrouping'
import type { DistributionBucket } from './distribution'
import { allocateWholePercentages } from './wholePercentages'
import type { Member } from '../members/member'

export const TOP_COMPANY_COUNT = 10

const NO_COMPANY_BUCKET = {
  key: 'no-company',
  label: 'No company recorded',
} as const

/* `distinctCompanyCount` counts distinct spellings, not distinct employers, and
   the screen says so where it shows the number. Case and spacing are collapsed;
   nothing else is, so `Google` and `Google Israel` are two of these. */
export type CompanyBreakdown = {
  buckets: readonly DistributionBucket[]
  distinctCompanyCount: number
  totalMemberCount: number
  membersWithoutCompanyCount: number
  companiesNotShownCount: number
  membersNotShownCount: number
}

const EMPTY_BREAKDOWN: CompanyBreakdown = {
  buckets: [],
  distinctCompanyCount: 0,
  totalMemberCount: 0,
  membersWithoutCompanyCount: 0,
  companiesNotShownCount: 0,
  membersNotShownCount: 0,
}

/* Percentages are allocated over the whole community \u{2014} the ten shown, the
   members at every other company, and the members with no company \u{2014} and only
   then sliced down to what the chart draws. Allocating over the ten alone would
   report a company of 40 people as a third of the community. */
export const buildCompanyBreakdown = (members: readonly Member[]): CompanyBreakdown => {
  if (members.length === 0) {
    return EMPTY_BREAKDOWN
  }

  const { groups, membersWithoutCompanyCount } = groupMembersByCompany(members)
  const shownGroups = groups.slice(0, TOP_COMPANY_COUNT)
  const membersNotShownCount = groups
    .slice(TOP_COMPANY_COUNT)
    .reduce((sum, group) => sum + group.count, 0)

  const percentages = allocateWholePercentages([
    ...shownGroups.map((group) => group.count),
    membersWithoutCompanyCount,
    membersNotShownCount,
  ])

  const companyBuckets = shownGroups.map((group, index) => ({
    key: group.key,
    label: group.label,
    count: group.count,
    percentage: percentages[index] ?? 0,
    isUnknown: false,
  }))
  const noCompanyBuckets =
    membersWithoutCompanyCount === 0
      ? []
      : [
          {
            ...NO_COMPANY_BUCKET,
            count: membersWithoutCompanyCount,
            percentage: percentages[shownGroups.length] ?? 0,
            isUnknown: true,
          },
        ]

  return {
    buckets: [...companyBuckets, ...noCompanyBuckets],
    distinctCompanyCount: groups.length,
    totalMemberCount: members.length,
    membersWithoutCompanyCount,
    companiesNotShownCount: groups.length - shownGroups.length,
    membersNotShownCount,
  }
}
