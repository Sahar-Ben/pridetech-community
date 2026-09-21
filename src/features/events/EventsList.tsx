import { EventListGroup } from './EventListGroup'
import { EventsLocalChangeNotice } from './EventsLocalChangeNotice'
import { COMPACT_BUTTON_SIZE_CLASSES, PRIMARY_BUTTON_CLASSES } from './eventButtonStyles'
import type { CommunityEvent } from './communityEvent'
import type { EventLocalChange } from './eventLocalChange'
import type { EventSchedule } from './eventSchedule'
import type { Registrant } from './registrant'

const ADD_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type EventsListProps = {
  schedule: EventSchedule
  registrants: readonly Registrant[]
  localChange: EventLocalChange | undefined
  onAddEvent: () => void
  onOpenEvent: (event: CommunityEvent) => void
  onEditEvent: (event: CommunityEvent) => void
  onArchiveEvent: (event: CommunityEvent) => void
}

export const EventsList = ({
  schedule,
  registrants,
  localChange,
  onAddEvent,
  onOpenEvent,
  onEditEvent,
  onArchiveEvent,
}: EventsListProps) => {
  const isEmpty = schedule.upcomingEvents.length === 0 && schedule.pastEvents.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button className={ADD_BUTTON_CLASSES} onClick={onAddEvent} type="button">
          Add event
        </button>
      </div>

      <div aria-live="polite">
        {localChange !== undefined && <EventsLocalChangeNotice change={localChange} />}
      </div>

      {isEmpty ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No events yet. Adding one here keeps it in this browser only.
        </p>
      ) : (
        <>
          <EventListGroup
            emptyMessage="Nothing scheduled."
            events={schedule.upcomingEvents}
            onArchiveEvent={onArchiveEvent}
            onEditEvent={onEditEvent}
            onOpenEvent={onOpenEvent}
            registrants={registrants}
            title="Upcoming"
          />
          <EventListGroup
            emptyMessage="No events have happened yet."
            events={schedule.pastEvents}
            onArchiveEvent={onArchiveEvent}
            onEditEvent={onEditEvent}
            onOpenEvent={onOpenEvent}
            registrants={registrants}
            title="Past"
          />
        </>
      )}
    </div>
  )
}
