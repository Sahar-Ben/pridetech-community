import { doesEmailMatch } from './emailMatch'
import { doesTextMatchSearch } from './searchWords'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

/* `existingRegistrant` is the duplicate guard: a member who is already on this
   event's list must be checked in, never added a second time, or the event ends
   with two rows for one person and an attendance figure nobody can reconcile. */
export type CommunitySearchResult = {
  member: Member
  existingRegistrant: Registrant | undefined
}

const toSearchableText = (member: Member): string => [member.name, member.mail].join(' ')

const findRegistrantForMember = ({
  member,
  registrants,
}: {
  member: Member
  registrants: readonly Registrant[]
}): Registrant | undefined =>
  registrants.find(
    (registrant) =>
      registrant.email !== undefined &&
      doesEmailMatch({ left: registrant.email, right: member.mail }),
  )

export const searchCommunityMembers = ({
  members,
  registrants,
  searchText,
}: {
  members: readonly Member[]
  registrants: readonly Registrant[]
  searchText: string
}): readonly CommunitySearchResult[] => {
  if (searchText.trim() === '') {
    return []
  }
  return members
    .filter((member) => doesTextMatchSearch({ text: toSearchableText(member), searchText }))
    .map((member) => ({
      member,
      existingRegistrant: findRegistrantForMember({ member, registrants }),
    }))
}
