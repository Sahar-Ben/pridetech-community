import { useRef, useState } from 'react'
import { CheckInScreen } from './CheckInScreen'
import { EventDetail } from './EventDetail'
import { EventForm } from './EventForm'
import { EventsList } from './EventsList'
import { addWalkInRegistrant, toggleRegistrantCheckIn } from './checkIn'
import { appendEvent, archiveEvent, replaceEvent } from './eventUpdates'
import {
  applyDraftToEvent,
  createEventFromDraft,
  EMPTY_EVENT_DRAFT,
  toEventDraft,
  type EventDraft,
} from './eventDraft'
import { groupEventsForListing } from './eventSchedule'
import { selectEventRegistrants } from './eventRegistrants'
import type { CommunityEvent } from './communityEvent'
import type { EventLocalChange } from './eventLocalChange'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import type { WalkInFields } from './walkInValidation'

type EventsView =
  | { kind: 'list' }
  | { kind: 'add' }
  | { kind: 'edit'; eventId: string }
  | { kind: 'detail'; eventId: string }
  | { kind: 'check-in'; eventId: string }

type EventsWorkspaceProps = {
  events: readonly CommunityEvent[]
  registrants: readonly Registrant[]
  members: readonly Member[]
  today: string
}

export const EventsWorkspace = ({
  events: loadedEvents,
  registrants: loadedRegistrants,
  members,
  today,
}: EventsWorkspaceProps) => {
  const [events, setEvents] = useState(loadedEvents)
  const [registrants, setRegistrants] = useState(loadedRegistrants)
  const [localChange, setLocalChange] = useState<EventLocalChange | undefined>(undefined)
  const [view, setView] = useState<EventsView>({ kind: 'list' })
  const nextLocalNumber = useRef(1)

  const takeLocalId = (prefix: string): string => {
    const localId = `${prefix}-local-${nextLocalNumber.current}`
    nextLocalNumber.current += 1
    return localId
  }

  const openList = () => setView({ kind: 'list' })

  const archiveListedEvent = (event: CommunityEvent) => {
    setEvents((currentEvents) => archiveEvent({ events: currentEvents, eventId: event.id }))
    setLocalChange({ kind: 'event-archived', eventName: event.name })
  }

  const saveNewEvent = (draft: EventDraft) => {
    const newEvent = createEventFromDraft({ id: takeLocalId('event'), draft })
    setEvents((currentEvents) => appendEvent({ events: currentEvents, newEvent }))
    setLocalChange({ kind: 'event-saved', eventName: newEvent.name })
    openList()
  }

  const saveEditedEvent = ({ event, draft }: { event: CommunityEvent; draft: EventDraft }) => {
    const updatedEvent = applyDraftToEvent({ event, draft })
    setEvents((currentEvents) => replaceEvent({ events: currentEvents, updatedEvent }))
    setLocalChange({ kind: 'event-saved', eventName: updatedEvent.name })
    openList()
  }

  const closeOutEvent = (event: CommunityEvent) => {
    setEvents((currentEvents) =>
      replaceEvent({ events: currentEvents, updatedEvent: { ...event, isClosedOut: true } }),
    )
  }

  const toggleCheckIn = (registrantId: string) => {
    setRegistrants((currentRegistrants) =>
      toggleRegistrantCheckIn({
        registrants: currentRegistrants,
        registrantId,
        checkedInAt: new Date().toISOString(),
      }),
    )
  }

  const addWalkIn = ({ eventId, walkIn }: { eventId: string; walkIn: WalkInFields }) => {
    setRegistrants((currentRegistrants) =>
      addWalkInRegistrant({
        registrants: currentRegistrants,
        walkIn: {
          id: takeLocalId('walk-in'),
          eventId,
          name: walkIn.name,
          email: walkIn.email,
          checkedInAt: new Date().toISOString(),
        },
      }),
    )
  }

  const openEvent =
    view.kind === 'list' || view.kind === 'add'
      ? undefined
      : events.find((event) => event.id === view.eventId)

  if (view.kind === 'add') {
    return (
      <EventForm
        initialDraft={EMPTY_EVENT_DRAFT}
        onCancel={openList}
        onSave={saveNewEvent}
        title="Add event"
      />
    )
  }

  if (openEvent !== undefined && view.kind === 'edit') {
    return (
      <EventForm
        initialDraft={toEventDraft(openEvent)}
        onCancel={openList}
        onSave={(draft) => saveEditedEvent({ event: openEvent, draft })}
        title="Edit event"
      />
    )
  }

  if (openEvent !== undefined && view.kind === 'detail') {
    return (
      <EventDetail
        event={openEvent}
        members={members}
        onBack={openList}
        onCloseOut={() => closeOutEvent(openEvent)}
        onOpenCheckIn={() => setView({ kind: 'check-in', eventId: openEvent.id })}
        registrants={selectEventRegistrants({ registrants, eventId: openEvent.id })}
      />
    )
  }

  if (openEvent !== undefined && view.kind === 'check-in') {
    return (
      <CheckInScreen
        event={openEvent}
        onAddWalkIn={(walkIn) => addWalkIn({ eventId: openEvent.id, walkIn })}
        members={members}
        onBack={() => setView({ kind: 'detail', eventId: openEvent.id })}
        onToggleCheckIn={toggleCheckIn}
        registrants={selectEventRegistrants({ registrants, eventId: openEvent.id })}
      />
    )
  }

  return (
    <EventsList
      localChange={localChange}
      onAddEvent={() => setView({ kind: 'add' })}
      onArchiveEvent={archiveListedEvent}
      onEditEvent={(event) => setView({ kind: 'edit', eventId: event.id })}
      onOpenEvent={(event) => setView({ kind: 'detail', eventId: event.id })}
      registrants={registrants}
      schedule={groupEventsForListing({ events, today })}
    />
  )
}
