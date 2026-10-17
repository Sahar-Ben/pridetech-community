import { doesTextMatchSearch } from './searchWords'
import { listMemberEmails, type Member } from '../members/member'

const MAX_RESULTS = 8

/* Name and every address, so a member can be found by the name they go by or
   by an address the organiser remembers. Capped, because the list sits in a
   dialog on a phone and the right person is found by typing more, not by
   scrolling through 787. */
export const searchMembersToLink = ({
  members,
  searchText,
}: {
  members: readonly Member[]
  searchText: string
}): readonly Member[] => {
  if (searchText.trim() === '') {
    return []
  }
  return members
    .filter((member) =>
      doesTextMatchSearch({
        text: [member.name, ...listMemberEmails(member)].join(' '),
        searchText,
      }),
    )
    .slice(0, MAX_RESULTS)
}
