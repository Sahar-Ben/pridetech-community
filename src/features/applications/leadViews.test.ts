import { describe, expect, it } from 'vitest'
import { isDecliningOffered, LEAD_VIEWS, selectApplicationsInView } from './leadViews'
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

describe('LEAD_VIEWS', () => {
  it('should offer the reviewer the two states they can act on, and no Approved browser', () => {
    expect(LEAD_VIEWS).toEqual(['Pending', 'Declined'])
  })
})
