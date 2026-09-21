import type { CompanyBreakdown } from './companyBreakdown'
import type { Distribution } from './distribution'

const pluralise = ({ count, noun }: { count: number; noun: string }): string =>
  count === 1 ? noun : `${noun}s`

/* The sentence that keeps a chart honest, and it is rendered next to the chart
   rather than under a fold: a reader who glances at the bars and never reads
   another word should still have been told what the bars leave out. */
export const describeUnknownShare = ({
  distribution,
  whatIsMissing,
}: {
  distribution: Distribution
  whatIsMissing: string
}): string => {
  if (distribution.total === 0) {
    return 'There are no members to count.'
  }
  if (distribution.unknownCount === 0) {
    return `Every one of the ${distribution.total} members counted here is accounted for.`
  }
  return `${distribution.unknownCount} of ${distribution.total} members (${distribution.unknownPercentage}%) ${whatIsMissing}.`
}

const describeCompaniesShown = (breakdown: CompanyBreakdown): string => {
  const shownCount = breakdown.buckets.filter((bucket) => !bucket.isUnknown).length
  const spellingNoun = pluralise({ count: breakdown.distinctCompanyCount, noun: 'spelling' })
  if (breakdown.companiesNotShownCount === 0) {
    return `Showing all ${breakdown.distinctCompanyCount} company ${spellingNoun}.`
  }
  return `Showing the ${shownCount} largest of ${breakdown.distinctCompanyCount} company ${spellingNoun}.`
}

const describeCompanyGaps = (breakdown: CompanyBreakdown): string => {
  if (breakdown.membersWithoutCompanyCount === 0) {
    return 'Every member counted here has a company recorded.'
  }
  const withoutCompany = `${breakdown.membersWithoutCompanyCount} ${breakdown.membersWithoutCompanyCount === 1 ? 'has' : 'have'} no company recorded`
  if (breakdown.membersNotShownCount === 0) {
    return `${breakdown.membersWithoutCompanyCount} of ${breakdown.totalMemberCount} members have no company recorded.`
  }
  return `${breakdown.membersNotShownCount} members work somewhere else; ${withoutCompany}.`
}

export const describeCompanyCoverage = (breakdown: CompanyBreakdown): string =>
  `${describeCompaniesShown(breakdown)} ${describeCompanyGaps(breakdown)}`
