import type { Member } from '../features/members/member'

/* Every optional column starts empty, so a test only states the fields it is
   actually about and any test that forgets one is exercising the sparse row. */
export const buildMember = (overrides: Partial<Member> = {}): Member => ({
  rowNumber: 2,
  name: 'Sample Person',
  company: undefined,
  title: undefined,
  gender: undefined,
  mail: 'sample.person@example.com',
  informedForMembership: undefined,
  phone: undefined,
  city: undefined,
  linkedIn: undefined,
  interests: undefined,
  shirtSize: undefined,
  notes: undefined,
  status: 'Active',
  removalReason: undefined,
  approvedAt: undefined,
  ...overrides,
})
