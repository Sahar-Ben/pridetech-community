import { EventListGroup } from './EventListGroup'
import { EventsChangeNotice } from './EventsChangeNotice'
import { GiveSheetAccessButton } from './GiveSheetAccessButton'
import type { EventChange } from './eventChangeText'
import { COMPACT_BUTTON_SIZE_CLASSES, PRIMARY_BUTTON_CLASSES } from '../../theme/controls'
import type { CommunityEvent } from './communityEvent'
import type { EventSchedule } from './eventSchedule'
import { EMPTY_STATE_CLASSES } from '../../theme/surfaces'

const ADD_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type EventsListProps = {
  schedule: EventSchedule
  describeAttendance: (event: CommunityEvent) => string
  change: EventChange | undefined
  onAddEvent: () => void
  onOpenEvent: (event: CommunityEvent) => void
  onEditEvent: (event: CommunityEvent) => void
  onGiveSheetAccess: () => Promise<number>
}

export const EventsList = ({
  schedule,
  describeAttendance,
  change,
  onAddEvent,
  onOpenEvent,
  onEditEvent,
  onGiveSheetAccess,
}: EventsListProps) => {
  const isEmpty = schedule.upcomingEvents.length === 0 && schedule.pastEvents.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-end gap-2">
        <GiveSheetAccessButton onGiveAccess={onGiveSheetAccess} />
        <button className={ADD_BUTTON_CLASSES} onClick={onAddEvent} type="button">
          Add event
        </button>
      </div>

      <div aria-live="polite">
        {change !== undefined && <EventsChangeNotice change={change} />}
      </div>

      {isEmpty ? (
        <p className={EMPTY_STATE_CLASSES}>
          No events yet. Adding one writes it to the Events tab of your spreadsheet.
        </p>
      ) : (
        <>
          <EventListGroup
            describeAttendance={describeAttendance}
            emptyMessage="Nothing scheduled."
            events={schedule.upcomingEvents}
            onEditEvent={onEditEvent}
            onOpenEvent={onOpenEvent}
            title="Upcoming"
          />
          <EventListGroup
            describeAttendance={describeAttendance}
            emptyMessage="No events have happened yet."
            events={schedule.pastEvents}
            onEditEvent={onEditEvent}
            onOpenEvent={onOpenEvent}
            title="Past"
          />
        </>
      )}
    </div>
  )
}
