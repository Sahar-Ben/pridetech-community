import { useRef, useState } from 'react'
import { CheckInScreen } from './CheckInScreen'
import { EventDetail } from './EventDetail'
import { EventForm } from './EventForm'
import { EventsList } from './EventsList'
import { addWalkInRegistrant, toggleRegistrantCheckIn } from './checkIn'
import { EMPTY_EVENT_DRAFT, toEventDraft, applyDraftToEvent, type EventDraft } from './eventDraft'
import { groupEventsForListing } from './eventSchedule'
import { selectEventRegistrants } from './eventRegistrants'
import { selectSheetsForEvent, type AttachedResponseSheet } from './parseAttachedSheets'
import type { CommunityEvent } from './communityEvent'
import type { EventChange } from './eventChangeText'
import type { EventRegistryWriter } from './eventRegistryWriter'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import type { ResponseSheetAccess } from './responseSheetAccess'
import type { WalkInFields } from './walkInValidation'

type EventsView =
  | { kind: 'list' }
  | { kind: 'add' }
  | { kind: 'edit'; eventId: string }
  | { kind: 'detail'; eventId: string }
  | { kind: 'check-in'; eventId: string }

type EventsWorkspaceProps = {
  events: readonly CommunityEvent[]
  attachedSheets: readonly AttachedResponseSheet[]
  registrants: readonly Registrant[]
  members: readonly Member[]
  today: string
  writer: EventRegistryWriter
  responseSheetAccess: ResponseSheetAccess
}

/* The events themselves are never held here. Every change goes to the sheet
   and the section re-reads the registry afterwards, because an appended row's
   number is something only the sheet knows and a guessed one is how a later
   edit lands on somebody else's event.

   The walk-ins are held here, and they are the exception that has to be said
   out loud on screen: nothing writes them anywhere. */
export const EventsWorkspace = ({
  events,
  attachedSheets,
  registrants: loadedRegistrants,
  members,
  today,
  writer,
  responseSheetAccess,
}: EventsWorkspaceProps) => {
  const [registrants, setRegistrants] = useState(loadedRegistrants)
  const [change, setChange] = useState<EventChange | undefined>(undefined)
  const [view, setView] = useState<EventsView>({ kind: 'list' })
  const nextWalkInNumber = useRef(1)

  const openList = () => setView({ kind: 'list' })

  const archiveListedEvent = async (event: CommunityEvent): Promise<void> => {
    await writer.saveEvent({ originalEvent: event, updatedEvent: { ...event, isArchived: true } })
    setChange({ kind: 'archived', eventName: event.name })
  }

  const saveNewEvent = async (draft: EventDraft): Promise<void> => {
    await writer.addEvent({ draft })
    setChange({ kind: 'added', eventName: draft.name.trim() })
    openList()
  }

  const saveEditedEvent = async ({
    event,
    draft,
  }: {
    event: CommunityEvent
    draft: EventDraft
  }): Promise<void> => {
    const updatedEvent = applyDraftToEvent({ event, draft })
    await writer.saveEvent({ originalEvent: event, updatedEvent })
    setChange({ kind: 'saved', eventName: updatedEvent.name })
    openList()
  }

  const closeOutEvent = async (event: CommunityEvent): Promise<void> => {
    await writer.saveEvent({ originalEvent: event, updatedEvent: { ...event, isClosedOut: true } })
    setChange({ kind: 'saved', eventName: event.name })
  }

  const attachSheetToEvent = async ({
    event,
    attachment,
  }: {
    event: CommunityEvent
    attachment: Parameters<EventRegistryWriter['attachSheet']>[0]['attachment']
  }): Promise<void> => {
    await writer.attachSheet({ attachment })
    setChange({ kind: 'sheet-attached', eventName: event.name })
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
    const id = `walk-in-local-${nextWalkInNumber.current}`
    nextWalkInNumber.current += 1
    setRegistrants((currentRegistrants) =>
      addWalkInRegistrant({
        registrants: currentRegistrants,
        walkIn: {
          id,
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
        onSave={async (draft) => await saveEditedEvent({ event: openEvent, draft })}
        title="Edit event"
      />
    )
  }

  if (openEvent !== undefined && view.kind === 'detail') {
    return (
      <EventDetail
        attachedSheets={selectSheetsForEvent({ sheets: attachedSheets, eventId: openEvent.id })}
        event={openEvent}
        members={members}
        onAttachSheet={async ({ attachment }) =>
          await attachSheetToEvent({ event: openEvent, attachment })
        }
        onBack={openList}
        onCloseOut={async () => await closeOutEvent(openEvent)}
        onOpenCheckIn={() => setView({ kind: 'check-in', eventId: openEvent.id })}
        registrants={selectEventRegistrants({ registrants, eventId: openEvent.id })}
        responseSheetAccess={responseSheetAccess}
      />
    )
  }

  if (openEvent !== undefined && view.kind === 'check-in') {
    return (
      <CheckInScreen
        event={openEvent}
        members={members}
        onAddWalkIn={(walkIn) => addWalkIn({ eventId: openEvent.id, walkIn })}
        onBack={() => setView({ kind: 'detail', eventId: openEvent.id })}
        onToggleCheckIn={toggleCheckIn}
        registrants={selectEventRegistrants({ registrants, eventId: openEvent.id })}
      />
    )
  }

  return (
    <EventsList
      change={change}
      onAddEvent={() => setView({ kind: 'add' })}
      onArchiveEvent={archiveListedEvent}
      onEditEvent={(event) => setView({ kind: 'edit', eventId: event.id })}
      onOpenEvent={(event) => setView({ kind: 'detail', eventId: event.id })}
      registrants={registrants}
      schedule={groupEventsForListing({ events, today })}
    />
  )
}
