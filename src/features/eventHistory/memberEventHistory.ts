import type { CommunityEventHistory } from './loadCommunityEventHistory'
import type { CommunityEvent } from '../events/communityEvent'
import { hasRegistrantArrived, type Registrant } from '../events/registrant'
import { resolveRegistrantLink } from '../events/registrantLink'
import type { Member } from '../members/member'

/* `not-recorded` is a past event nobody closed out, which is every event from
   before the app: calling its registrants no-shows would be inventing an
   absence nobody saw. */
export type MemberEventStatus = 'attended' | 'no-show' | 'waitlist' | 'registered' | 'not-recorded'

export type MemberEventEntry = {
  event: CommunityEvent
  status: MemberEventStatus
  isWalkIn: boolean
  isMatchedByName: boolean
}

const statusAt = ({
  registrant,
  event,
  today,
}: {
  registrant: Registrant
  event: CommunityEvent
  today: string
}): MemberEventStatus => {
  if (hasRegistrantArrived(registrant)) {
    return 'attended'
  }
  if (registrant.registration === 'waitlist') {
    return 'waitlist'
  }
  if (event.isClosedOut) {
    return 'no-show'
  }
  return event.date < today ? 'not-recorded' : 'registered'
}

/* A member is on an event when a registrant there resolves to them the same
   way the event's own list resolves them: by email, or by their unique full
   name on the sheets that never asked for an email. Newest event first. */
export const buildMemberEventHistory = ({
  member,
  members,
  history,
  today,
}: {
  member: Member
  members: readonly Member[]
  history: CommunityEventHistory
  today: string
}): readonly MemberEventEntry[] =>
  history.events
    .flatMap((event) => {
      const eventRegistrants = history.registrants.filter(
        (registrant) => registrant.eventId === event.id,
      )
      const found = eventRegistrants
        .map((registrant) => ({
          registrant,
          link: resolveRegistrantLink({ registrant, members, eventRegistrants }),
        }))
        .find(
          ({ link }) =>
            (link.kind === 'member' || link.kind === 'member-by-name') &&
            link.rowNumber === member.rowNumber,
        )
      if (found === undefined) {
        return []
      }
      return [
        {
          event,
          status: statusAt({ registrant: found.registrant, event, today }),
          isWalkIn: found.registrant.isWalkIn,
          isMatchedByName: found.link.kind === 'member-by-name',
        },
      ]
    })
    .toSorted((earlier, later) => later.event.date.localeCompare(earlier.event.date))

export type MemberEventSummary = {
  eventCount: number
  attendedCount: number
  noShowCount: number
}

export const summariseMemberEvents = (
  entries: readonly MemberEventEntry[],
): MemberEventSummary => ({
  eventCount: entries.length,
  attendedCount: entries.filter((entry) => entry.status === 'attended').length,
  noShowCount: entries.filter((entry) => entry.status === 'no-show').length,
})
