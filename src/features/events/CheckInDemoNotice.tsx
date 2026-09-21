import { NoticeBanner } from '../../app/NoticeBanner'

/* Standing at a real door with this screen open is the way this app could do
   actual harm: an evening of taps that looked recorded and were not. The
   warning is permanent and sits above the list, not behind a first tap. */
export const CheckInDemoNotice = () => (
  <NoticeBanner
    detail="Everyone listed here is invented sample data. Taps stay in this browser tab, nothing is written to the Google Sheet, and every check-in is lost the moment the page reloads."
    title="Do not use this at a real door. Attendance is not being recorded anywhere."
    tone="danger"
  />
)
