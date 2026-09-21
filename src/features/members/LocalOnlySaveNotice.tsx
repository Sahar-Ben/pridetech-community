import { NoticeBanner } from '../../app/NoticeBanner'

/* Speaks only for the edit it is shown next to. It used to add that nothing in
   the app writes to the sheet, which stopped being true the day an approval
   started appending a member row: the sections this renders on are the ones
   still working from sample data, and saying so for all of them would now be
   telling a reviewer their approvals are not landing either. */
export const LocalOnlySaveNotice = () => (
  <NoticeBanner
    detail="This edit has not been written to the Google Sheet, and it will be lost when you reload the page."
    title="Saved in this browser only."
    tone="warning"
  />
)
