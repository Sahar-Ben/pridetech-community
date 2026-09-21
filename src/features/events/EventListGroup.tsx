import { useId } from 'react'
import { EventRow } from './EventRow'
import { describeAttendanceForListing } from './eventAttendanceText'
import { selectEventRegistrants } from './eventRegistrants'
import { summariseEventAttendance } from './eventAttendance'
import type { CommunityEvent } from './communityEvent'
import type { Registrant } from './registrant'

type EventListGroupProps = {
  title: string
  events: readonly CommunityEvent[]
  registrants: readonly Registrant[]
  emptyMessage: string
  onOpenEvent: (event: CommunityEvent) => void
  onEditEvent: (event: CommunityEvent) => void
  onArchiveEvent: (event: CommunityEvent) => void
}

export const EventListGroup = ({
  title,
  events,
  registrants,
  emptyMessage,
  onOpenEvent,
  onEditEvent,
  onArchiveEvent,
}: EventListGroupProps) => {
  const headingId = useId()

  const describeEvent = (event: CommunityEvent): string =>
    describeAttendanceForListing(
      summariseEventAttendance({
        registrants: selectEventRegistrants({ registrants, eventId: event.id }),
        isClosedOut: event.isClosedOut,
      }),
    )

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3
        className="text-sm font-semibold text-slate-500 uppercase dark:text-slate-400"
        id={headingId}
      >
        {title}
      </h3>
      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <EventRow
              attendanceText={describeEvent(event)}
              event={event}
              key={event.id}
              onArchive={onArchiveEvent}
              onEdit={onEditEvent}
              onOpen={onOpenEvent}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
