import { describe, expect, it } from 'vitest'
import { describeUnsavedDecision } from './unsavedDecision'
import type { Lead } from './lead'

const lead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 2,
  name: 'Noa Feldman',
  jobTitle: undefined,
  company: undefined,
  linkedIn: undefined,
  email: 'noa@example.com',
  phone: undefined,
  city: undefined,
  interests: undefined,
  status: 'pending',
  ...overrides,
})

describe('describeUnsavedDecision', () => {
  it('should say plainly that an approval never reached the spreadsheet', () => {
    const message = describeUnsavedDecision({ decision: 'approve', lead: lead() })

    expect(message).toContain('Noa Feldman')
    expect(message).toMatch(/not written to the google sheet/i)
  })

  it('should say plainly that a decline never reached the spreadsheet', () => {
    const message = describeUnsavedDecision({ decision: 'decline', lead: lead() })

    expect(message).toMatch(/declin/i)
    expect(message).toMatch(/not written to the google sheet/i)
  })

  it('should fall back to the email when the applicant has no name', () => {
    const message = describeUnsavedDecision({ decision: 'approve', lead: lead({ name: undefined }) })

    expect(message).toContain('noa@example.com')
  })
})
