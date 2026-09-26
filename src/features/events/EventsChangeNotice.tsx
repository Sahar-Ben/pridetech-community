import { describeEventChange, type EventChange } from './eventChangeText'
import { NoticeBanner } from '../../app/NoticeBanner'

export const EventsChangeNotice = ({ change }: { change: EventChange }) => (
  <NoticeBanner
    detail={describeEventChange(change)}
    role="status"
    title="Saved to the Google Sheet."
    tone="success"
  />
)
