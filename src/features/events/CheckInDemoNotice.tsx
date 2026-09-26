import { NoticeBanner } from '../../app/NoticeBanner'

/* Standing at a real door with this screen open is the way this app could do
   actual harm: an evening of taps that looked recorded and were not. The event
   and its registrants are read from the sheets now, which makes this screen
   look more finished than it is, so the warning is permanent and sits above the list. */
export const CheckInDemoNotice = () => (
  <NoticeBanner
    detail="The list below is read from this event's response sheets, but there is nowhere yet for a check-in to go: taps stay in this browser tab, nothing is written to the Google Sheet, and every one of them is lost the moment the page reloads."
    title="Do not use this at a real door. Attendance is not being recorded anywhere."
    tone="danger"
  />
)
