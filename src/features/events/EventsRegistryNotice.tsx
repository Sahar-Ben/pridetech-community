import { NoticeBanner } from '../../app/NoticeBanner'

/* Half of this screen reads and writes the spreadsheet and half of it does
   not, and the half that does not is the half somebody could stand at a door
   believing. Saying which is which, once, above everything, is the only way
   the events being real does not make the registrant list look real too. */
export const EventsRegistryNotice = () => (
  <NoticeBanner
    detail="Registrants, check-in and attendance are not built yet: no response sheet has been read, and nothing you tap at a door is recorded anywhere."
    title="Events are read from and written to your spreadsheet. The people at them are not."
    tone="warning"
  />
)
