export const MEMBER_STATUSES = ['Active', 'Ex-member'] as const

export type MemberStatus = (typeof MEMBER_STATUSES)[number]

export const REMOVAL_REASONS = [
  'Left tech',
  'Requested removal',
  'Moved abroad',
  'Unreachable',
  'Code of conduct',
  'Other',
] as const

export type RemovalReason = (typeof REMOVAL_REASONS)[number]

export type MemberGender = 'F' | 'M'

/* The sheet's `Meetup` column is deliberately absent. It holds a legacy value
   like `1st` and is being retired; showing it would invite people to keep
   filling it in. */
export type Member = {
  rowNumber: number
  name: string
  company: string | undefined
  title: string | undefined
  gender: MemberGender | undefined
  mail: string
  informedForMembership: string | undefined
  phone: string | undefined
  city: string | undefined
  linkedIn: string | undefined
  interests: string | undefined
  shirtSize: string | undefined
  notes: string | undefined
  status: MemberStatus
  removalReason: RemovalReason | undefined
  approvedAt: string | undefined
}
