import { useId } from 'react'
import { EventRow } from './EventRow'
import type { CommunityEvent } from './communityEvent'
import { EMPTY_STATE_CLASSES } from '../../theme/surfaces'

type EventListGroupProps = {
  title: string
  events: readonly CommunityEvent[]
  describeAttendance: (event: CommunityEvent) => string
  emptyMessage: string
  onOpenEvent: (event: CommunityEvent) => void
  onEditEvent: (event: CommunityEvent) => void
}

export const EventListGroup = ({
  title,
  events,
  describeAttendance,
  emptyMessage,
  onOpenEvent,
  onEditEvent,
}: EventListGroupProps) => {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3
        className="font-mono text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase"
        id={headingId}
      >
        {title}
      </h3>
      {events.length === 0 ? (
        <p className={`${EMPTY_STATE_CLASSES} py-6`}>{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <EventRow
              attendanceText={describeAttendance(event)}
              event={event}
              key={event.id}
              onEdit={onEditEvent}
              onOpen={onOpenEvent}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
