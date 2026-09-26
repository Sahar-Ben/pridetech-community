import { describe, expect, it } from 'vitest'
import {
  findViewForArrowKey,
  isDecliningOffered,
  isMaybeOffered,
  LEAD_VIEWS,
  selectApplicationsInView,
  selectCountInView,
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

describe('selectCountInView', () => {
  const counts = {
    waitingCount: 256,
    alreadyMemberCount: 824,
    maybeCount: 7,
    declinedCount: 12,
    leadsWithoutEmailCount: 1,
    membersWithoutEmailCount: 3,
    repeatedLeadEmailCount: 69,
  }

  it('should count the applications waiting for review under Pending', () => {
    expect(selectCountInView({ counts, view: 'Pending' })).toBe(256)
  })

  it('should count what is kept for later under Maybe', () => {
    expect(selectCountInView({ counts, view: 'Maybe' })).toBe(7)
  })

  it('should count the refusals under Declined', () => {
    expect(selectCountInView({ counts, view: 'Declined' })).toBe(12)
  })

  /* The chip says how many applications that filter holds. The applications
     already on the Members tab are the ones Pending set aside, so counting them
     here would promise a list twice as long as the one that opens. */
  it('should leave the applications from existing members out of the Pending count', () => {
    expect(selectCountInView({ counts, view: 'Pending' })).not.toBe(
      counts.waitingCount + counts.alreadyMemberCount,
    )
  })
})

describe('findViewForArrowKey', () => {
  it('should move to the next filter on the right arrow', () => {
    expect(findViewForArrowKey({ key: 'ArrowRight', view: 'Pending' })).toBe('Maybe')
  })

  it('should move to the previous filter on the left arrow', () => {
    expect(findViewForArrowKey({ key: 'ArrowLeft', view: 'Declined' })).toBe('Maybe')
  })

  it('should wrap from the last filter round to the first', () => {
    expect(findViewForArrowKey({ key: 'ArrowRight', view: 'Declined' })).toBe('Pending')
  })

  it('should wrap from the first filter back to the last', () => {
    expect(findViewForArrowKey({ key: 'ArrowLeft', view: 'Pending' })).toBe('Declined')
  })

  it('should jump to the first filter on Home and the last on End', () => {
    expect(findViewForArrowKey({ key: 'Home', view: 'Declined' })).toBe('Pending')
    expect(findViewForArrowKey({ key: 'End', view: 'Pending' })).toBe('Declined')
  })

  /* Undefined rather than the current view: the caller only calls
     preventDefault on a key this answers, and answering every key would swallow
     Tab out of the filter row. */
  it('should answer nothing for a key that does not move between filters', () => {
    expect(findViewForArrowKey({ key: 'Tab', view: 'Pending' })).toBe(undefined)
    expect(findViewForArrowKey({ key: 'a', view: 'Pending' })).toBe(undefined)
  })
})
