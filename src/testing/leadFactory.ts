import type { Lead } from '../features/applications/lead'

/* Every optional cell starts empty, the way `buildMember` does: an application
   row on this sheet is mostly blanks, and a test that has to fill eleven fields
   to say one thing stops saying it. */
export const buildLead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 2,
  timestamp: '3/8/2025 14:25:20',
  name: 'Sample Applicant',
  jobTitle: undefined,
  company: undefined,
  linkedIn: undefined,
  email: 'sample.applicant@example.com',
  phone: undefined,
  city: undefined,
  interests: undefined,
  status: 'approved',
  ...overrides,
})
