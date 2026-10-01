import { splitInterests } from './applicantTags'
import type { ReviewableApplication } from './leadsReview'

/* Newest is the order the review already holds, so it costs nothing; the
   others are re-sorts of whatever the filters left. */
export const LEAD_SORTS = ['newest', 'oldest', 'name', 'company'] as const

export type LeadSort = (typeof LEAD_SORTS)[number]

export const LEAD_SORT_LABELS: Readonly<Record<LeadSort, string>> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  name: 'Name A–Z',
  company: 'Company A–Z',
}

export const LINKEDIN_FILTERS = ['any', 'with', 'without'] as const

export type LinkedInFilter = (typeof LINKEDIN_FILTERS)[number]

export const LINKEDIN_FILTER_LABELS: Readonly<Record<LinkedInFilter, string>> = {
  any: 'Any',
  with: 'Has LinkedIn',
  without: 'No LinkedIn',
}

export type LeadListQuery = {
  searchText: string
  sort: LeadSort
  city: string | undefined
  interest: string | undefined
  linkedIn: LinkedInFilter
}

export const EMPTY_LEAD_LIST_QUERY: LeadListQuery = {
  searchText: '',
  sort: 'newest',
  city: undefined,
  interest: undefined,
  linkedIn: 'any',
}

/* City and interest are compared case- and space-insensitively, because the
   form lets people type `Tel aviv ` as easily as `Tel Aviv`. */
const normalise = (value: string): string => value.trim().replace(/\s+/g, ' ').toLowerCase()

const SEARCHED_FIELDS = ['name', 'email', 'company', 'jobTitle'] as const

const matchesSearch = (application: ReviewableApplication, searchText: string): boolean => {
  const term = normalise(searchText)
  if (term === '') {
    return true
  }
  return SEARCHED_FIELDS.some((field) => {
    const value = application.lead[field]
    return value !== undefined && normalise(value).includes(term)
  })
}

const matchesCity = (application: ReviewableApplication, city: string | undefined): boolean =>
  city === undefined ||
  (application.lead.city !== undefined && normalise(application.lead.city) === normalise(city))

const matchesInterest = (
  application: ReviewableApplication,
  interest: string | undefined,
): boolean =>
  interest === undefined ||
  splitInterests(application.lead.interests).some(
    (candidate) => normalise(candidate) === normalise(interest),
  )

const matchesLinkedIn = (application: ReviewableApplication, filter: LinkedInFilter): boolean => {
  if (filter === 'any') {
    return true
  }
  const hasProfile = application.lead.linkedIn !== undefined
  return filter === 'with' ? hasProfile : !hasProfile
}

const displayName = (application: ReviewableApplication): string =>
  application.lead.name ?? application.lead.email

/* A blank company sorts last rather than first: an empty string would put
   every applicant who skipped the question at the top of an A–Z list. */
const compareText = (first: string | undefined, second: string | undefined): number => {
  if (first === undefined || second === undefined) {
    return first === second ? 0 : first === undefined ? 1 : -1
  }
  return first.localeCompare(second, undefined, { sensitivity: 'base' })
}

const SORTERS: Readonly<
  Record<
    LeadSort,
    (applications: readonly ReviewableApplication[]) => readonly ReviewableApplication[]
  >
> = {
  newest: (applications) => applications,
  oldest: (applications) => applications.toReversed(),
  name: (applications) =>
    applications.toSorted((first, second) => compareText(displayName(first), displayName(second))),
  company: (applications) =>
    applications.toSorted(
      (first, second) =>
        compareText(first.lead.company?.trim(), second.lead.company?.trim()) ||
        compareText(displayName(first), displayName(second)),
    ),
}

/* The applications arrive newest first from `buildLeadsReview`; every other
   order is derived from that one, so ties keep a stable, explainable order. */
export const applyLeadListQuery = ({
  applications,
  query,
}: {
  applications: readonly ReviewableApplication[]
  query: LeadListQuery
}): readonly ReviewableApplication[] =>
  SORTERS[query.sort](
    applications.filter(
      (application) =>
        matchesSearch(application, query.searchText) &&
        matchesCity(application, query.city) &&
        matchesInterest(application, query.interest) &&
        matchesLinkedIn(application, query.linkedIn),
    ),
  )

/* Sort is not a filter: it hides nobody, so it does not count towards the
   number on the button that says how much of the list is being held back. */
export const countActiveFilters = (query: LeadListQuery): number =>
  [
    query.searchText.trim() !== '',
    query.city !== undefined,
    query.interest !== undefined,
    query.linkedIn !== 'any',
  ].filter(Boolean).length

export type FacetOption = {
  value: string
  count: number
}

/* The values worth offering are the ones in the list being read, most common
   first, each spelled the way it most often appears. */
const toFacetOptions = (values: readonly string[], limit: number): readonly FacetOption[] => {
  const byKey = new Map<string, { spellings: Map<string, number>; count: number }>()
  for (const value of values) {
    const key = normalise(value)
    if (key === '') {
      continue
    }
    const entry = byKey.get(key) ?? { spellings: new Map<string, number>(), count: 0 }
    const spelling = value.trim().replace(/\s+/g, ' ')
    entry.spellings.set(spelling, (entry.spellings.get(spelling) ?? 0) + 1)
    entry.count += 1
    byKey.set(key, entry)
  }
  return [...byKey.values()]
    .map(({ spellings, count }) => ({
      value:
        [...spellings.entries()].toSorted((first, second) => second[1] - first[1])[0]?.[0] ?? '',
      count,
    }))
    .toSorted(
      (first, second) => second.count - first.count || first.value.localeCompare(second.value),
    )
    .slice(0, limit)
}

export const CITY_OPTION_LIMIT = 12

export const INTEREST_OPTION_LIMIT = 16

export const listCityOptions = (
  applications: readonly ReviewableApplication[],
): readonly FacetOption[] =>
  toFacetOptions(
    applications.flatMap((application) =>
      application.lead.city === undefined ? [] : [application.lead.city],
    ),
    CITY_OPTION_LIMIT,
  )

export const listInterestOptions = (
  applications: readonly ReviewableApplication[],
): readonly FacetOption[] =>
  toFacetOptions(
    applications.flatMap((application) => splitInterests(application.lead.interests)),
    INTEREST_OPTION_LIMIT,
  )
