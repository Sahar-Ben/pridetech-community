export const describeCheckInToggle = ({
  name,
  wasCheckedIn,
}: {
  name: string
  wasCheckedIn: boolean
}): string => `${name} ${wasCheckedIn ? 'check-in undone' : 'checked in'}`

/* The members-only line is a record, not a refusal: the organiser standing at
   the door has already decided to let this person in, and what they need
   afterwards is to be able to see that they did. */
export const describeWalkInAdded = ({
  name,
  isCommunityMember,
  isMembersOnly,
}: {
  name: string
  isCommunityMember: boolean
  isMembersOnly: boolean
}): string => {
  if (isCommunityMember) {
    return `${name} added from the member list and checked in`
  }
  const added = `${name} added as a walk-in and checked in`
  if (!isMembersOnly) {
    return added
  }
  return `${added}. This event is members only and they are not in the member list.`
}
