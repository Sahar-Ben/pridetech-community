import type { Member, MemberGender, MemberStatus, RemovalReason } from './member'

export type MemberDraftTextKey =
  | 'name'
  | 'company'
  | 'title'
  | 'mail'
  | 'phone'
  | 'city'
  | 'linkedIn'
  | 'interests'
  | 'shirtSize'
  | 'notes'
  | 'informedForMembership'

export type MemberDraft = Record<MemberDraftTextKey, string> & {
  gender: MemberGender | ''
  status: MemberStatus
  removalReason: RemovalReason | ''
}

const toFieldValue = (value: string | undefined): string => value ?? ''

const toRecordedValue = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export const toMemberDraft = (member: Member): MemberDraft => ({
  name: member.name,
  company: toFieldValue(member.company),
  title: toFieldValue(member.title),
  mail: member.mail,
  phone: toFieldValue(member.phone),
  city: toFieldValue(member.city),
  linkedIn: toFieldValue(member.linkedIn),
  interests: toFieldValue(member.interests),
  shirtSize: toFieldValue(member.shirtSize),
  notes: toFieldValue(member.notes),
  informedForMembership: toFieldValue(member.informedForMembership),
  gender: member.gender ?? '',
  status: member.status,
  removalReason: member.removalReason ?? '',
})

export const withDraftStatus = ({
  draft,
  status,
}: {
  draft: MemberDraft
  status: MemberStatus
}): MemberDraft => ({
  ...draft,
  status,
  removalReason: status === 'Ex-member' ? draft.removalReason : '',
})

export const applyDraftToMember = ({
  member,
  draft,
}: {
  member: Member
  draft: MemberDraft
}): Member => ({
  rowNumber: member.rowNumber,
  approvedAt: member.approvedAt,
  name: draft.name.trim(),
  mail: draft.mail.trim(),
  company: toRecordedValue(draft.company),
  title: toRecordedValue(draft.title),
  phone: toRecordedValue(draft.phone),
  city: toRecordedValue(draft.city),
  linkedIn: toRecordedValue(draft.linkedIn),
  interests: toRecordedValue(draft.interests),
  shirtSize: toRecordedValue(draft.shirtSize),
  notes: toRecordedValue(draft.notes),
  informedForMembership: toRecordedValue(draft.informedForMembership),
  gender: draft.gender === '' ? undefined : draft.gender,
  status: draft.status,
  removalReason:
    draft.status === 'Ex-member' && draft.removalReason !== '' ? draft.removalReason : undefined,
})

export const hasMailChanged = ({
  member,
  draft,
}: {
  member: Member
  draft: MemberDraft
}): boolean => draft.mail.trim() !== member.mail
