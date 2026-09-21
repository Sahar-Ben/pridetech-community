import { describe, expect, it } from 'vitest'
import {
  isDecliningOffered,
  isMaybeOffered,
  LEAD_VIEWS,
  selectApplicationsInView,
} from './leadViews'
import type { Lead } from './lead'
import { buildLeadsReviewFixture } from '../../testing/leadsReviewFactory'

const lead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 2,
  timestamp: '3/8/2025 14:25:20',
  name: 'Dana Maman',
  jobTitle: 'Founder',
  company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana',
  email: 'dana@example.com',
  phone: '050-000-0000',
  city: 'Tel Aviv',
  interests: 'AI',
  status: 'pending',
  ...overrides,
})

const reviewOfBoth = () =>
  buildLeadsReviewFixture({
    leads: [
      lead({ rowNumber: 2, name: 'Still Waiting', email: 'waiting@example.com' }),
      lead({
        rowNumber: 3,
        name: 'Turned Away',
        email: 'declined@example.com',
        status: 'declined',
      }),
    ],
  })

const namesIn = ({ view }: { view: (typeof LEAD_VIEWS)[number] }): readonly (string | undefined)[] =>
  selectApplicationsInView({ review: reviewOfBoth(), view }).map(
    (application) => application.lead.name,
  )

describe('selectApplicationsInView', () => {
  it('should show only the applications waiting for review under Pending', () => {
    expect(namesIn({ view: 'Pending' })).toEqual(['Still Waiting'])
  })

  it('should show only the applications that were declined under Declined', () => {
    expect(namesIn({ view: 'Declined' })).toEqual(['Turned Away'])
  })
})

describe('isDecliningOffered', () => {
  it('should offer declining while an application is still pending', () => {
    expect(isDecliningOffered({ view: 'Pending' })).toBe(true)
  })

  it('should never offer declining an application that is already declined', () => {
    expect(isDecliningOffered({ view: 'Declined' })).toBe(false)
  })
})


describe('the maybe view', () => {
  const reviewOfThree = () =>
    buildLeadsReviewFixture({
      leads: [
        lead({ rowNumber: 2, name: 'Still Waiting', email: 'waiting@example.com' }),
        lead({ rowNumber: 3, name: 'Turned Away', email: 'declined@example.com', status: 'declined' }),
        lead({ rowNumber: 4, name: 'Come Back Later', email: 'maybe@example.com', status: 'maybe' }),
      ],
    })

  it('should list only the applications kept for later under Maybe', () => {
    const applications = selectApplicationsInView({ review: reviewOfThree(), view: 'Maybe' })

    expect(applications.map((application) => application.lead.name)).toEqual(['Come Back Later'])
  })

  it('should keep an application kept for later out of the pending queue', () => {
    const applications = selectApplicationsInView({ review: reviewOfThree(), view: 'Pending' })

    expect(applications.map((application) => application.lead.name)).toEqual(['Still Waiting'])
  })

  it('should offer the reviewer the three states they can act on, and no Approved browser', () => {
    expect(LEAD_VIEWS).toEqual(['Pending', 'Maybe', 'Declined'])
  })

  it('should offer declining an application that is only being kept for later', () => {
    expect(isDecliningOffered({ view: 'Maybe' })).toBe(true)
  })

  it('should offer keeping an application for later only while it is pending', () => {
    expect(isMaybeOffered({ view: 'Pending' })).toBe(true)
    expect(isMaybeOffered({ view: 'Maybe' })).toBe(false)
    expect(isMaybeOffered({ view: 'Declined' })).toBe(false)
  })
})
