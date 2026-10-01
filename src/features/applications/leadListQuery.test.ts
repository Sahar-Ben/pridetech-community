import { describe, expect, it } from 'vitest'
import type { Lead } from './lead'
import {
  applyLeadListQuery,
  countActiveFilters,
  EMPTY_LEAD_LIST_QUERY,
  listCityOptions,
  listInterestOptions,
  type LeadListQuery,
} from './leadListQuery'
import type { ReviewableApplication } from './leadsReview'

const application = (overrides: Partial<Lead> = {}): ReviewableApplication => ({
  lead: {
    rowNumber: 2,
    timestamp: '3/8/2025 14:25:20',
    name: 'Dana Maman',
    jobTitle: 'Founder',
    company: 'Salted Mind',
    linkedIn: 'https://linkedin.com/in/dana',
    email: 'dana@example.com',
    phone: '050',
    city: 'Tel Aviv',
    interests: 'AI, Product',
    status: 'pending',
    ...overrides,
  },
  priorMember: undefined,
})

const query = (overrides: Partial<LeadListQuery> = {}): LeadListQuery => ({
  ...EMPTY_LEAD_LIST_QUERY,
  ...overrides,
})

const namesOf = (applications: readonly ReviewableApplication[]): readonly (string | undefined)[] =>
  applications.map((each) => each.lead.name)

/* Newest first, as `buildLeadsReview` hands them over. */
const queue = [
  application({
    rowNumber: 4,
    name: 'Noa Levi',
    company: 'Orbit',
    city: 'Haifa',
    interests: 'Cloud',
  }),
  application({ rowNumber: 3, name: 'avi Cohen', company: undefined, linkedIn: undefined }),
  application({
    rowNumber: 2,
    name: 'Maya Rosen',
    company: 'Kite',
    city: ' tel  aviv',
    jobTitle: 'Designer',
  }),
]

describe('applyLeadListQuery, sorting', () => {
  it('should keep the newest-first order it was given by default', () => {
    expect(namesOf(applyLeadListQuery({ applications: queue, query: query() }))).toEqual([
      'Noa Levi',
      'avi Cohen',
      'Maya Rosen',
    ])
  })

  it('should reverse it for oldest first', () => {
    expect(
      namesOf(applyLeadListQuery({ applications: queue, query: query({ sort: 'oldest' }) })),
    ).toEqual(['Maya Rosen', 'avi Cohen', 'Noa Levi'])
  })

  it('should sort by name without caring about case', () => {
    expect(
      namesOf(applyLeadListQuery({ applications: queue, query: query({ sort: 'name' }) })),
    ).toEqual(['avi Cohen', 'Maya Rosen', 'Noa Levi'])
  })

  it('should sort by company and put a blank company last', () => {
    expect(
      namesOf(applyLeadListQuery({ applications: queue, query: query({ sort: 'company' }) })),
    ).toEqual(['Maya Rosen', 'Noa Levi', 'avi Cohen'])
  })
})

describe('applyLeadListQuery, filtering', () => {
  it('should search name, email, company and job title', () => {
    expect(
      namesOf(
        applyLeadListQuery({ applications: queue, query: query({ searchText: 'designer' }) }),
      ),
    ).toEqual(['Maya Rosen'])
    expect(
      namesOf(applyLeadListQuery({ applications: queue, query: query({ searchText: 'ORBIT' }) })),
    ).toEqual(['Noa Levi'])
  })

  it('should match a city however it was typed', () => {
    expect(
      namesOf(applyLeadListQuery({ applications: queue, query: query({ city: 'Tel Aviv' }) })),
    ).toEqual(['avi Cohen', 'Maya Rosen'])
  })

  it('should match one interest out of the several an applicant picked', () => {
    expect(
      namesOf(applyLeadListQuery({ applications: queue, query: query({ interest: 'product' }) })),
    ).toEqual(['avi Cohen', 'Maya Rosen'])
  })

  it('should keep only applicants without a LinkedIn profile when asked', () => {
    expect(
      namesOf(applyLeadListQuery({ applications: queue, query: query({ linkedIn: 'without' }) })),
    ).toEqual(['avi Cohen'])
  })

  it('should apply every filter at once', () => {
    expect(
      namesOf(
        applyLeadListQuery({
          applications: queue,
          query: query({ city: 'Tel Aviv', linkedIn: 'with', sort: 'name' }),
        }),
      ),
    ).toEqual(['Maya Rosen'])
  })
})

describe('countActiveFilters', () => {
  it('should count nothing for the default query', () => {
    expect(countActiveFilters(query())).toBe(0)
  })

  it('should count each narrowing filter but not the sort', () => {
    expect(
      countActiveFilters(query({ searchText: 'x', city: 'Haifa', linkedIn: 'with', sort: 'name' })),
    ).toBe(3)
  })
})

describe('facet options', () => {
  it('should offer each city once, most common first, in its most common spelling', () => {
    expect(listCityOptions(queue)).toEqual([
      { value: 'Tel Aviv', count: 2 },
      { value: 'Haifa', count: 1 },
    ])
  })

  it('should offer each interest once with how many picked it', () => {
    expect(listInterestOptions(queue)).toEqual([
      { value: 'AI', count: 2 },
      { value: 'Product', count: 2 },
      { value: 'Cloud', count: 1 },
    ])
  })
})
