import { LocalOnlySaveNotice } from '../members/LocalOnlySaveNotice'
import type { EventLocalChange } from './eventLocalChange'

const DETAIL_CLASSES = 'text-sm font-medium text-on-brand'

type EventsLocalChangeNoticeProps = {
  change: EventLocalChange
}

export const EventsLocalChangeNotice = ({ change }: EventsLocalChangeNoticeProps) => (
  <div className="flex flex-col gap-2">
    <LocalOnlySaveNotice />
    {change.kind === 'event-archived' ? (
      <p className={DETAIL_CLASSES}>
        {change.eventName} was archived, not deleted. Its attendance is kept, because deleting an
        event would take it out of every member&rsquo;s event history.
      </p>
    ) : (
      <p className={DETAIL_CLASSES}>{change.eventName} was saved.</p>
    )}
  </div>
)
