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
   filling it in.

   `name` and `mail` are the empty string when the cell is blank, where every
   other absent field is `undefined`. The Members tab does hold rows with one or
   the other missing and they have to appear in the directory, but these two are
   also what the events screens match attendance on, and those are typed for a
   string. `hasRecordedMail` is how this feature asks, so no screen compares
   against `''` by hand.

   `removalReason` is whatever the cell says rather than one of `REMOVAL_REASONS`.
   The list is what the edit form offers; a reason typed into the sheet by hand
   is still that member's reason, and narrowing it to `undefined` here would show
   an ex-member as having no reason recorded. */
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
  removalReason: string | undefined
  approvedAt: string | undefined
}

export const hasRecordedMail = (member: Member): boolean => member.mail !== ''

export const toRecordedMail = (member: Member): string | undefined =>
  hasRecordedMail(member) ? member.mail : undefined
