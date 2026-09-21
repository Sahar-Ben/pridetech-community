/* `isClosedOut` is the organiser saying "the door is shut, this is the final
   attendance". It is what separates a registrant who has not arrived yet from
   one who never came, so no-show is only ever derived from a closed-out event.
   Archiving hides an event from the lists without dropping its attendance,
   which every member's event history is counted from.

   `host` is the company putting the event on, and a themed social has none.

   `isMembersOnly` is the door policy: most events accept members of the
   community only, and a few, like the singles evenings, accept anyone. It
   warns the organiser at the door and never refuses anybody, because the
   person standing there is the one who decides. */
export type CommunityEvent = {
  id: string
  name: string
  date: string
  host: string | undefined
  location: string
  isMembersOnly: boolean
  isClosedOut: boolean
  isArchived: boolean
}
