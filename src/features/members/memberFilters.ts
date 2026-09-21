import type { Member, MemberStatus } from './member'

export const MEMBER_STATUS_FILTERS = ['Active', 'Ex-member', 'All'] as const

export type MemberStatusFilter = (typeof MEMBER_STATUS_FILTERS)[number]

const SEARCHED_FIELDS = ['name', 'mail', 'company'] as const satisfies ReadonlyArray<keyof Member>

const doesFieldContain = ({
  field,
  searchTerm,
}: {
  field: string | undefined
  searchTerm: string
}): boolean => field !== undefined && field.toLowerCase().includes(searchTerm)

export const doesMemberMatchSearch = ({
  member,
  searchText,
}: {
  member: Member
  searchText: string
}): boolean => {
  const searchTerm = searchText.trim().toLowerCase()
  if (searchTerm === '') {
    return true
  }
  return SEARCHED_FIELDS.some((field) => doesFieldContain({ field: member[field], searchTerm }))
}

export const doesMemberMatchStatus = ({
  member,
  statusFilter,
}: {
  member: Member
  statusFilter: MemberStatusFilter
}): boolean => statusFilter === 'All' || member.status === statusFilter

export const filterMembers = ({
  members,
  searchText,
  statusFilter,
}: {
  members: readonly Member[]
  searchText: string
  statusFilter: MemberStatusFilter
}): readonly Member[] =>
  members.filter(
    (member) =>
      doesMemberMatchStatus({ member, statusFilter }) && doesMemberMatchSearch({ member, searchText }),
  )

const ACTIVE_STATUS: MemberStatus = 'Active'

export const selectActiveMembers = (members: readonly Member[]): readonly Member[] =>
  members.filter((member) => member.status === ACTIVE_STATUS)
