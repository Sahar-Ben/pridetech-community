import { buildCompanyBreakdown, type CompanyBreakdown } from './companyBreakdown'
import type { Distribution } from './distribution'
import { buildGenderDistribution } from './genderDistribution'
import { buildTenureDistribution } from './tenureDistribution'
import { buildPositionDistribution, buildSeniorityDistribution } from './titleDistributions'
import type { Lead } from '../applications/lead'
import type { LeadsReviewCounts } from '../applications/leadsReview'
import type { Member } from '../members/member'
import { selectActiveMembers } from '../members/memberFilters'

export type MemberOverview = {
  memberCount: number
  exMemberCount: number
  gender: Distribution
  tenure: Distribution
  position: Distribution
  seniority: Distribution
  companies: CompanyBreakdown
}

/* The member charts plus the review queue's counts, drawn from the same two
   reads by the same `buildLeadsReview` the Leads screen uses, so the Overview
   can never quote a different number of waiting applications than the queue. */
export type Overview = MemberOverview & {
  applications: LeadsReviewCounts
}

/* Active members only, and every chart on the same denominator. The members
   directory already reports its gender split over the active members, and two
   screens in one app quoting two different percentages for the same question is
   how people stop trusting both of them. */
export const buildOverview = ({
  members,
  leads,
  asOf,
}: {
  members: readonly Member[]
  leads: readonly Lead[]
  asOf: Date
}): MemberOverview => {
  const activeMembers = selectActiveMembers(members)

  return {
    memberCount: activeMembers.length,
    exMemberCount: members.length - activeMembers.length,
    gender: buildGenderDistribution(activeMembers),
    tenure: buildTenureDistribution({ members: activeMembers, leads, asOf }),
    position: buildPositionDistribution(activeMembers),
    seniority: buildSeniorityDistribution(activeMembers),
    companies: buildCompanyBreakdown(activeMembers),
  }
}
