import type { Member } from '../members/member'
import type { WalkInFields } from './walkInValidation'
import type { Registrant } from './registrant'

export type WalkInDraft = {
  id: string
  eventId: string
  name: string
  email: string
  checkedInAt: string
}

const toOptionalText = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export const toggleRegistrantCheckIn = ({
  registrants,
  registrantId,
  checkedInAt,
}: {
  registrants: readonly Registrant[]
  registrantId: string
  checkedInAt: string
}): readonly Registrant[] =>
  registrants.map((registrant) => {
    if (registrant.id !== registrantId) {
      return registrant
    }
    return {
      ...registrant,
      checkedInAt: registrant.checkedInAt === undefined ? checkedInAt : undefined,
    }
  })

/* A walk-in is created already checked in: the only way one gets added is
   somebody standing at the door saying their name. */
export const createWalkInRegistrant = (walkIn: WalkInDraft): Registrant => ({
  id: walkIn.id,
  eventId: walkIn.eventId,
  name: walkIn.name.trim(),
  email: toOptionalText(walkIn.email),
  company: undefined,
  jobTitle: undefined,
  registration: 'registered',
  checkedInAt: walkIn.checkedInAt,
  guestOfEmail: undefined,
  isWalkIn: true,
})

export const addWalkInRegistrant = ({
  registrants,
  walkIn,
}: {
  registrants: readonly Registrant[]
  walkIn: WalkInDraft
}): readonly Registrant[] => [...registrants, createWalkInRegistrant(walkIn)]

/* A member added at the door carries their member email, which is what every
   later read of the row matches on: the event ends with a matched member rather
   than a walk-in nobody can place. */
export const toWalkInFieldsFromMember = (member: Member): WalkInFields => ({
  name: member.name,
  email: member.mail,
})
