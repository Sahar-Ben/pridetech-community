import type { Member } from '../members/member'
import type { WalkInFields } from './walkInValidation'

/* A member added at the door carries their member email, which is what every
   later read of the row matches on: the event ends with a matched member rather
   than a walk-in nobody can place. */
export const toWalkInFieldsFromMember = (member: Member): WalkInFields => ({
  name: member.name,
  email: member.mail,
})
