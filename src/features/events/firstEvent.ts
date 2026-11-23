import type { CommunityEvent } from './communityEvent'
import { hasRegistrantArrived, type Registrant } from './registrant'
import { toComparableName } from './registrantLink'
import type { EventRegistrantsLoad } from './useEventRegistrants'
import { listMemberEmails, type Member } from '../members/member'
import { toEmailKey } from '../../sheets/emailKey'

/* The events that could hold somebody's earlier visit: every listed event
   dated before this one. Archived events are left out, the way every event
   history in the app leaves them out. */
export const selectEarlierEvents = ({
  event,
  events,
}: {
  event: CommunityEvent
  events: readonly CommunityEvent[]
}): readonly CommunityEvent[] =>
  events.filter(
    (other) => !other.isArchived && other.id !== event.id && other.date < event.date,
  )

/* Having been to an event, by the rule the Members screen counts events with
   (memberEventCounts.ts): checked in, or holding a place at an event nobody
   closed out, which is every event from before the app kept attendance. A
   no-show and a waiting-list entry never came. */
const hasBeenPartOf = ({
  registrant,
  event,
}: {
  registrant: Registrant
  event: CommunityEvent
}): boolean =>
  hasRegistrantArrived(registrant) || (registrant.registration === 'registered' && !event.isClosedOut)

/* Members by each of their addresses, and by full name where exactly one
   member carries it: the same two ways an event's list resolves a registrant
   (registrantLink.ts), built once so the door does not search 800 members for
   every row on every tap. */
type MemberIndex = {
  byEmail: ReadonlyMap<string, number>
  byUniqueName: ReadonlyMap<string, number>
}

const buildMemberIndex = (members: readonly Member[]): MemberIndex => {
  const byEmail = new Map<string, number>()
  const rowsByName = new Map<string, number[]>()
  members.forEach((member) => {
    listMemberEmails(member).forEach((email) => {
      const key = toEmailKey(email)
      if (!byEmail.has(key)) {
        byEmail.set(key, member.rowNumber)
      }
    })
    const name = toComparableName(member.name)
    rowsByName.set(name, [...(rowsByName.get(name) ?? []), member.rowNumber])
  })
  const byUniqueName = new Map(
    [...rowsByName].flatMap(([name, rows]) =>
      rows.length === 1 && rows[0] !== undefined && name.includes(' ') ? [[name, rows[0]] as const] : [],
    ),
  )
  return { byEmail, byUniqueName }
}

/* Everything that says two rows on two events are the same person: the member
   they are, their address, and their full name. Matching on more makes the
   badge rarer, never wrong the other way: telling a regular it is their first
   time is the mistake worth avoiding, and missing a newcomer's badge costs a
   warm welcome they get anyway. A single word is not a name to match on. */
const identityKeysOf = ({
  registrant,
  memberIndex,
}: {
  registrant: Registrant
  memberIndex: MemberIndex
}): readonly string[] => {
  const email = registrant.email === undefined ? undefined : toEmailKey(registrant.email)
  const name = toComparableName(registrant.name)
  const hasFullName = name.includes(' ')
  const memberRows = [
    email === undefined ? undefined : memberIndex.byEmail.get(email),
    hasFullName ? memberIndex.byUniqueName.get(name) : undefined,
  ].filter((row) => row !== undefined)
  return [
    ...memberRows.map((row) => `member:${row}`),
    ...(email === undefined ? [] : [`email:${email}`]),
    ...(hasFullName ? [`name:${name}`] : []),
  ]
}

/* The ids of this event's registrants, walk-ins included, who are on no
   earlier event's list as somebody who came or could have. */
export const findFirstTimers = ({
  event,
  events,
  registrants,
  members,
}: {
  event: CommunityEvent
  events: readonly CommunityEvent[]
  registrants: readonly Registrant[]
  members: readonly Member[]
}): ReadonlySet<string> => {
  const memberIndex = buildMemberIndex(members)
  const earlierById = new Map(
    selectEarlierEvents({ event, events }).map((earlier) => [earlier.id, earlier]),
  )
  const seen = new Set<string>()
  registrants.forEach((registrant) => {
    const earlierEvent = earlierById.get(registrant.eventId)
    if (earlierEvent !== undefined && hasBeenPartOf({ registrant, event: earlierEvent })) {
      identityKeysOf({ registrant, memberIndex }).forEach((key) => seen.add(key))
    }
  })

  return new Set(
    registrants
      .filter(
        (registrant) =>
          registrant.eventId === event.id &&
          !identityKeysOf({ registrant, memberIndex }).some((key) => seen.has(key)),
      )
      .map((registrant) => registrant.id),
  )
}

/* Badges are only shown once every earlier event has been read, so they do
   not light up on everybody and then go out again as the older sheets arrive.
   An earlier event that could not be read, whole or in part, is counted, so
   the screen can say the badges may be wrong. */
export type FirstEventReadiness =
  | { kind: 'reading' }
  | { kind: 'ready'; unreadEventCount: number }

export const checkFirstEventReadiness = ({
  event,
  events,
  loads,
  hasReadAttendance,
}: {
  event: CommunityEvent
  events: readonly CommunityEvent[]
  loads: ReadonlyMap<string, EventRegistrantsLoad>
  hasReadAttendance: boolean
}): FirstEventReadiness => {
  const earlierEvents = selectEarlierEvents({ event, events })
  const isSettled = (load: EventRegistrantsLoad | undefined): boolean =>
    load !== undefined && (load.read !== undefined || load.errorMessage !== undefined)
  if (!hasReadAttendance || !earlierEvents.every((earlier) => isSettled(loads.get(earlier.id)))) {
    return { kind: 'reading' }
  }
  const unreadEventCount = earlierEvents.filter((earlier) => {
    const read = loads.get(earlier.id)?.read
    return read === undefined || read.problems.length > 0
  }).length
  return { kind: 'ready', unreadEventCount }
}

export const describeUnreadHistory = (unreadEventCount: number): string | undefined =>
  unreadEventCount === 0
    ? undefined
    : `${unreadEventCount} earlier ${unreadEventCount === 1 ? 'event' : 'events'} could not be read, so a First event badge may be wrong.`
