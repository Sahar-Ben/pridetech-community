/* One row of an event's response sheet, after the per-event column mapping has
   been applied. The optional fields are optional because the forms differ:
   the earliest events never asked for an email at all, and only some ask for
   company and job title.

   `checkedInAt` is the only record that someone actually walked in. Nothing
   else in the row is evidence of attendance: `registration` is intent. */
export const REGISTRATION_KINDS = ['registered', 'waitlist'] as const

export type RegistrationKind = (typeof REGISTRATION_KINDS)[number]

export type Registrant = {
  id: string
  eventId: string
  name: string
  email: string | undefined
  company: string | undefined
  jobTitle: string | undefined
  registration: RegistrationKind
  checkedInAt: string | undefined
  guestOfEmail: string | undefined
  isWalkIn: boolean
}

/* Arrival is the one fact the door establishes, and it is the fact both the
   check-in tabs and the attendance summary are partitioned on. */
export type ArrivedRegistrant = Registrant & { checkedInAt: string }

export const hasRegistrantArrived = (registrant: Registrant): registrant is ArrivedRegistrant =>
  registrant.checkedInAt !== undefined
