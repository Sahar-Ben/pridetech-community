import { doesEmailMatch } from './emailMatch'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

/* What the app is entitled to say about who a registrant is. `no-email` is
   kept apart from `unmatched` on purpose: the five earliest response sheets
   never asked for an email, so there is nothing to match on.

   Those rows are matched by name only when exactly one member carries exactly
   that full name, and the match says it was made by name, since a name is
   weaker evidence than an address. A first name alone, or a name two members
   share, stays `no-email`: guessing there links the wrong person. */
export type RegistrantLink =
  | { kind: 'member'; memberName: string; rowNumber: number }
  | { kind: 'member-by-name'; memberName: string; rowNumber: number }
  | { kind: 'guest'; hostName: string }
  | { kind: 'no-email' }
  | { kind: 'unmatched' }

const invisibleFormatting = /[\u{00ad}\u{200b}\u{200e}\u{200f}\u{2060}\u{feff}]/gu

const toComparableName = (name: string): string =>
  name.normalize('NFC').replace(invisibleFormatting, '').trim().replace(/\s+/g, ' ').toLowerCase()

const findMemberByName = ({
  name,
  members,
}: {
  name: string
  members: readonly Member[]
}): Member | undefined => {
  const wanted = toComparableName(name)
  if (!wanted.includes(' ')) {
    return undefined
  }
  const matches = members.filter((member) => toComparableName(member.name) === wanted)
  return matches.length === 1 ? matches[0] : undefined
}

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
    const namedMember = findMemberByName({ name: registrant.name, members })
    return namedMember === undefined
      ? { kind: 'no-email' }
      : { kind: 'member-by-name', memberName: namedMember.name, rowNumber: namedMember.rowNumber }
  }

  const matchedMember = members.find((member) => doesEmailMatch({ left: member.mail, right: email }))
  if (matchedMember === undefined) {
    return { kind: 'unmatched' }
  }
  return { kind: 'member', memberName: matchedMember.name, rowNumber: matchedMember.rowNumber }
}
