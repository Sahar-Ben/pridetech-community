import { useMemo, useState } from 'react'
import { CheckInScreen } from './CheckInScreen'
import { EventDetail } from './EventDetail'
import { EventForm } from './EventForm'
import { EventsList } from './EventsList'
import { applyAttendance } from './attendanceLog'
import type { AttendanceStore } from './attendanceStore'
import { summariseEventAttendance } from './eventAttendance'
import {
  describeAttendanceForListing,
  describeUnreadRegistrantsForListing,
} from './eventAttendanceText'
import { EMPTY_EVENT_DRAFT, toEventDraft, applyDraftToEvent, type EventDraft } from './eventDraft'
import { groupEventsForListing } from './eventSchedule'
import { selectEventRegistrants } from './eventRegistrants'
import { selectSheetsForEvent, type AttachedResponseSheet } from './parseAttachedSheets'
import type { CommunityEvent } from './communityEvent'
import type { EventChange } from './eventChangeText'
import type { EventRegistryWriter } from './eventRegistryWriter'
import type { Member } from '../members/member'
import type { ResponseSheetAccess } from './responseSheetAccess'
import { useAttendance } from './useAttendance'
import type { EventRegistrantsLoad } from './useEventRegistrants'
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
  registrantLoads: ReadonlyMap<string, EventRegistrantsLoad>
  onRequestRegistrants: (eventId: string) => void
  onReloadRegistrants: (eventId: string) => void
  members: readonly Member[]
  today: string
  writer: EventRegistryWriter
  responseSheetAccess: ResponseSheetAccess
  attendanceStore: AttendanceStore
  onSessionExpired: () => void
}

/* The events themselves are never held here. Every change goes to the sheet
   and the section re-reads the registry afterwards, because an appended row's
   number is something only the sheet knows and a guessed one is how a later
   edit lands on somebody else's event.

   Registrants are read from the response sheets by the section and handed in
   per event. Who has arrived comes from the Attendance tab's log, laid over
   them here, so a re-read of a response sheet brings in new registrations
   without undoing anybody's check-in, and a tap is a line in the log rather
   than an edit to anybody's registration. */
export const EventsWorkspace = ({
  events,
  attachedSheets,
  registrantLoads,
  onRequestRegistrants,
  onReloadRegistrants,
  members,
  today,
  writer,
  responseSheetAccess,
  attendanceStore,
  onSessionExpired,
}: EventsWorkspaceProps) => {
  const attendance = useAttendance({ store: attendanceStore, onSessionExpired })
  const [change, setChange] = useState<EventChange | undefined>(undefined)
  const [view, setView] = useState<EventsView>({ kind: 'list' })

  const registrants = useMemo(
    () =>
      [...registrantLoads].flatMap(([eventId, load]) =>
        applyAttendance({
          registrants: load.read?.registrants ?? [],
          entries: attendance.entries,
          eventId,
        }),
      ),
    [attendance.entries, registrantLoads],
  )

  const openList = () => setView({ kind: 'list' })

  const openEventView = ({ kind, eventId }: { kind: 'detail' | 'check-in'; eventId: string }) => {
    onRequestRegistrants(eventId)
    attendance.request()
    setView({ kind, eventId })
  }

  const describeListedAttendance = (event: CommunityEvent): string => {
    if (registrantLoads.get(event.id)?.read === undefined) {
      return describeUnreadRegistrantsForListing({
        hasAttachedSheet: attachedSheets.some((sheet) => sheet.eventId === event.id),
      })
    }
    return describeAttendanceForListing(
      summariseEventAttendance({
        registrants: selectEventRegistrants({ registrants, eventId: event.id }),
        isClosedOut: event.isClosedOut,
      }),
    )
  }

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
    const person = registrants.find((registrant) => registrant.id === registrantId)
    if (person === undefined) {
      return
    }
    attendance.record({
      eventId: person.eventId,
      email: person.email,
      name: person.name,
      status: person.checkedInAt === undefined ? 'attended' : 'undone',
      at: new Date().toISOString(),
    })
  }

  /* A walk-in is a check-in of somebody on no response sheet. One whose email
     is on a sheet after all is simply that registrant arriving. */
  const addWalkIn = ({ eventId, walkIn }: { eventId: string; walkIn: WalkInFields }) => {
    const email = walkIn.email.trim()
    attendance.record({
      eventId,
      email: email === '' ? undefined : email,
      name: walkIn.name.trim(),
      status: 'attended',
      at: new Date().toISOString(),
    })
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
        onOpenCheckIn={() => openEventView({ kind: 'check-in', eventId: openEvent.id })}
        onReloadRegistrants={() => onReloadRegistrants(openEvent.id)}
        registrantLoad={registrantLoads.get(openEvent.id)}
        registrants={selectEventRegistrants({ registrants, eventId: openEvent.id })}
        responseSheetAccess={responseSheetAccess}
      />
    )
  }

  if (openEvent !== undefined && view.kind === 'check-in') {
    return (
      <CheckInScreen
        attendanceStatus={attendance}
        event={openEvent}
        members={members}
        onAddWalkIn={(walkIn) => addWalkIn({ eventId: openEvent.id, walkIn })}
        onBack={() => openEventView({ kind: 'detail', eventId: openEvent.id })}
        onRefresh={attendance.reload}
        onToggleCheckIn={toggleCheckIn}
        registrants={selectEventRegistrants({ registrants, eventId: openEvent.id })}
      />
    )
  }

  return (
    <EventsList
      change={change}
      describeAttendance={describeListedAttendance}
      onAddEvent={() => setView({ kind: 'add' })}
      onArchiveEvent={archiveListedEvent}
      onEditEvent={(event) => setView({ kind: 'edit', eventId: event.id })}
      onOpenEvent={(event) => openEventView({ kind: 'detail', eventId: event.id })}
      schedule={groupEventsForListing({ events, today })}
    />
  )
}
