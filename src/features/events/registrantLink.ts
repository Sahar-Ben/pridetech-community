import { doesEmailMatch } from './emailMatch'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

/* What the app is entitled to say about who a registrant is. `no-email` is
   kept apart from `unmatched` on purpose: the five earliest response sheets
   never asked for an email, so there is nothing to match on and matching by
   name would be a guess dressed up as a fact. */
export type RegistrantLink =
  | { kind: 'member'; memberName: string; rowNumber: number }
  | { kind: 'guest'; hostName: string }
  | { kind: 'no-email' }
  | { kind: 'unmatched' }

const findHostName = ({
  guestOfEmail,
  members,
  eventRegistrants,
}: {
  guestOfEmail: string
  members: readonly Member[]
  eventRegistrants: readonly Registrant[]
}): string => {
  const hostMember = members.find((member) => doesEmailMatch({ left: member.mail, right: guestOfEmail }))
  if (hostMember !== undefined) {
    return hostMember.name
  }
  const hostRegistrant = eventRegistrants.find(
    (registrant) =>
      registrant.email !== undefined && doesEmailMatch({ left: registrant.email, right: guestOfEmail }),
  )
  return hostRegistrant?.name ?? guestOfEmail
}

export const resolveRegistrantLink = ({
  registrant,
  members,
  eventRegistrants,
}: {
  registrant: Registrant
  members: readonly Member[]
  eventRegistrants: readonly Registrant[]
}): RegistrantLink => {
  const { guestOfEmail, email } = registrant

  if (guestOfEmail !== undefined) {
    return { kind: 'guest', hostName: findHostName({ guestOfEmail, members, eventRegistrants }) }
  }
  if (email === undefined) {
    return { kind: 'no-email' }
  }

  const matchedMember = members.find((member) => doesEmailMatch({ left: member.mail, right: email }))
  if (matchedMember === undefined) {
    return { kind: 'unmatched' }
  }
  return { kind: 'member', memberName: matchedMember.name, rowNumber: matchedMember.rowNumber }
}
