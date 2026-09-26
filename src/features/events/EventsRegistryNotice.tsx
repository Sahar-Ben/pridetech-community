import { NoticeBanner } from '../../app/NoticeBanner'

/* The events and their registrants are read from the sheets and the door is
   not recorded anywhere, and the door is the half somebody could stand at
   believing. Saying which is which, once, above everything, is the only way
   a real registrant list does not make the check-ins look real too. */
export const EventsRegistryNotice = () => (
  <NoticeBanner
    detail="Registrants are read from each event's response sheets. Check-in and attendance are not built yet: nothing you tap at a door is recorded anywhere."
    title="Check-ins are not recorded yet."
    tone="warning"
  />
)
