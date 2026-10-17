import { useState } from 'react'
import { EventReconcileNotice } from './EventReconcileNotice'
import { EventRegistrantsReadStatus } from './EventRegistrantsReadStatus'
import { EventRegistrantsTable } from './EventRegistrantsTable'
import { EventResponseSheetsPanel } from './EventResponseSheetsPanel'
import { LinkToMemberDialog } from './LinkToMemberDialog'
import type { EmailLinkMode } from '../members/linkEmailToMember'
import { AttendeeTypeFilter } from './AttendeeTypeFilter'
import {
  ALL_ATTENDEE_TYPES,
  filterByAttendeeType,
  keepAvailableFilter,
  summariseAttendeeTypes,
  type AttendeeTypeFilter as AttendeeTypeFilterValue,
} from './attendeeTypes'
import { describeAttendanceForEvent, describeCloseOutConsequences } from './eventAttendanceText'
import { describeEventChange, type EventChange } from './eventChangeText'
import { formatEventDate } from './eventDate'
import { summariseEventAttendance } from './eventAttendance'
import { useAsyncAction } from './useAsyncAction'
import { ConfirmDialog } from '../../app/ConfirmDialog'
import { NoticeBanner } from '../../app/NoticeBanner'
import {
  COMPACT_BUTTON_SIZE_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
  TOUCH_BUTTON_SIZE_CLASSES,
} from '../../theme/controls'
import type { ResponseSheetAttachment } from './attachResponseSheet'
import type { AttachedResponseSheet } from './parseAttachedSheets'
import type { CommunityEvent } from './communityEvent'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import type { ResponseSheetAccess } from './responseSheetAccess'
import type { EventRegistrantsLoad } from './useEventRegistrants'
import { DATA_PANEL_CLASSES, RECORD_TITLE_CLASSES } from '../../theme/surfaces'

const BACK_ARROW = '\u{2190}'
const SEPARATOR = ' \u{00b7} '

const CLOSE_OUT_FAILED_MESSAGE =
  'The event was not closed out, and the Events tab was not changed.'

const REOPEN_FAILED_MESSAGE = 'Check-in was not reopened, and the Events tab was not changed.'

const CHECK_IN_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

const SECONDARY_ACTION_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const DETAIL_CLASSES = `${DATA_PANEL_CLASSES} animate-rise flex flex-col gap-4 px-4 py-4 sm:px-6`

type EventDetailProps = {
  event: CommunityEvent
  registrants: readonly Registrant[]
  registrantLoad: EventRegistrantsLoad | undefined
  members: readonly Member[]
  attachedSheets: readonly AttachedResponseSheet[]
  responseSheetAccess: ResponseSheetAccess
  onAttachSheet: (options: { attachment: ResponseSheetAttachment }) => Promise<void>
  /* After today: the door has not opened, so there is nothing to close out yet. */
  isUpcoming: boolean
  /* The last change made from the events screens, said here when it was made
     to this event, so adding one lands on it with its next step in view. */
  change: EventChange | undefined
  onBack: () => void
  onEdit: () => void
  onOpenCheckIn: () => void
  onCloseOut: () => Promise<void>
  onReopen: () => Promise<void>
  onReloadRegistrants: () => void
  /* Records the address a registrant used against the member they are, from
     the row that did not match. */
  onLinkEmailToMember: (options: {
    member: Member
    email: string
    mode: EmailLinkMode
  }) => Promise<void>
}

const LINK_FAILED_MESSAGE = 'The email was not saved, and the Members tab was not changed.'

const EMPTY_LIST_CLASSES =
  'rounded-xl border border-dashed border-edge px-4 py-10 text-center text-sm text-ink-muted'

/* Said only once there is something true to say: while the first read is on
   its way, "nobody has registered" would be a guess. */
const describeEmptyList = ({
  hasAttachedSheet,
  load,
}: {
  hasAttachedSheet: boolean
  load: EventRegistrantsLoad | undefined
}): string | undefined => {
  /* The response sheets panel above already says there is none and offers to
     attach one; saying it twice is only more to read. */
  if (!hasAttachedSheet) {
    return undefined
  }
  if (load?.read === undefined) {
    return undefined
  }
  if (load.read.problems.length > 0) {
    return 'No registrants could be read. See above for which sheet is missing.'
  }
  return 'Nobody has registered yet.'
}

export const EventDetail = ({
  event,
  registrants,
  registrantLoad,
  members,
  attachedSheets,
  responseSheetAccess,
  onAttachSheet,
  isUpcoming,
  change,
  onBack,
  onEdit,
  onOpenCheckIn,
  onCloseOut,
  onReopen,
  onLinkEmailToMember,
  onReloadRegistrants,
}: EventDetailProps) => {
  const closingOut = useAsyncAction({ fallbackMessage: CLOSE_OUT_FAILED_MESSAGE })
  const reopening = useAsyncAction({ fallbackMessage: REOPEN_FAILED_MESSAGE })
  const [isConfirmingCloseOut, setIsConfirmingCloseOut] = useState(false)
  const linking = useAsyncAction({ fallbackMessage: LINK_FAILED_MESSAGE })
  const [linkingRegistrant, setLinkingRegistrant] = useState<
    (Registrant & { email: string }) | undefined
  >(undefined)
  const [chosenAttendeeType, setChosenAttendeeType] =
    useState<AttendeeTypeFilterValue>(ALL_ATTENDEE_TYPES)
  const attendeeTypes = summariseAttendeeTypes(registrants)
  const attendeeTypeFilter = keepAvailableFilter({
    filter: chosenAttendeeType,
    summary: attendeeTypes,
  })
  const summary = summariseEventAttendance({ registrants, isClosedOut: event.isClosedOut })
  const noShowsIfClosed =
    summariseEventAttendance({ registrants, isClosedOut: true }).noShowCount ?? 0
  const placeLine = [formatEventDate(event.date), event.location.trim()]
    .filter((part) => part !== '')
    .join(SEPARATOR)
  const emptyListText = describeEmptyList({
    hasAttachedSheet: attachedSheets.length > 0,
    load: registrantLoad,
  })

  /* The dialog comes down only once the sheet has the change; a refusal
     leaves it up with the reason in it. */
  const closeOutEvent = () => {
    closingOut.run(async () => {
      await onCloseOut()
      setIsConfirmingCloseOut(false)
    })
  }

  const cancelCloseOut = () => {
    setIsConfirmingCloseOut(false)
    closingOut.forgetError()
  }

  /* The dialog comes down once the Members tab has the address, and the row
     it was opened from reads as a member as soon as the tab is read again. */
  const linkRegistrant = ({ member, mode }: { member: Member; mode: EmailLinkMode }) => {
    if (linkingRegistrant === undefined) {
      return
    }
    const { email } = linkingRegistrant
    linking.run(async () => {
      await onLinkEmailToMember({ member, email, mode })
      setLinkingRegistrant(undefined)
    })
  }

  const cancelLinking = () => {
    setLinkingRegistrant(undefined)
    linking.forgetError()
  }

  const reopenEvent = () => {
    reopening.run(async () => {
      await onReopen()
    })
  }

  return (
    <article className={DETAIL_CLASSES}>
      <div className="flex items-center justify-between gap-3">
        <button className={SECONDARY_ACTION_CLASSES} onClick={onBack} type="button">
          <span aria-hidden="true">{BACK_ARROW} </span>
          Back to events
        </button>
        <button className={SECONDARY_ACTION_CLASSES} onClick={onEdit} type="button">
          Edit event
        </button>
      </div>

      {change !== undefined && change.eventName === event.name && (
        <NoticeBanner
          detail={
            change.kind === 'added' && attachedSheets.length === 0
              ? 'Next, attach its response sheet below to see who registered.'
              : undefined
          }
          role="status"
          title={describeEventChange(change)}
          tone="success"
        />
      )}

      <div className="flex flex-col gap-1">
        <h3 className={RECORD_TITLE_CLASSES}>{event.name}</h3>
        <p className="text-sm text-ink">{placeLine}</p>
        {event.host !== undefined && <p className="text-sm text-ink">Hosted by {event.host}</p>}
        <p className="text-sm text-ink">
          {event.isMembersOnly
            ? 'Members only. The door warns before admitting somebody who is not in the member list.'
            : 'Open to non-members.'}
        </p>
        <p className="text-sm font-bold text-ink">{describeAttendanceForEvent(summary)}</p>
      </div>

      <div aria-live="polite">
        {reopening.errorMessage !== undefined && (
          <NoticeBanner role="alert" title={reopening.errorMessage} tone="danger" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {event.isClosedOut ? (
          <>
            <p className="text-sm text-ink">
              Closed out. This is the final attendance for the event.
            </p>
            {/* The same cell closing out set, set back: a person found later
                on somebody's list can still be checked in. */}
            <button
              className={SECONDARY_ACTION_CLASSES}
              disabled={reopening.isRunning}
              onClick={reopenEvent}
              type="button"
            >
              {reopening.isRunning ? 'Reopening\u{2026}' : 'Reopen check-in'}
            </button>
          </>
        ) : (
          <>
            <button className={CHECK_IN_BUTTON_CLASSES} onClick={onOpenCheckIn} type="button">
              Check in at the door
            </button>
            {/* Not offered before the day: closing out turns everyone not yet
                tapped in into a no-show, which before the door opens is
                everyone. */}
            {!isUpcoming && (
              <button
                className={SECONDARY_ACTION_CLASSES}
                onClick={() => setIsConfirmingCloseOut(true)}
                type="button"
              >
                Close out attendance
              </button>
            )}
          </>
        )}
      </div>

      {isConfirmingCloseOut && (
        <ConfirmDialog
          busyLabel={'Closing out\u{2026}'}
          cancelLabel="Not yet"
          confirmLabel="Close out"
          errorMessage={closingOut.errorMessage}
          isBusy={closingOut.isRunning}
          onCancel={cancelCloseOut}
          onConfirm={closeOutEvent}
          title={`Close out ${event.name}?`}
        >
          {describeCloseOutConsequences({
            checkedInCount: summary.checkedInCount,
            noShowCount: noShowsIfClosed,
          }).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </ConfirmDialog>
      )}

      <EventResponseSheetsPanel
        access={responseSheetAccess}
        attachedSheets={attachedSheets}
        eventId={event.id}
        onAttach={onAttachSheet}
      />

      <EventRegistrantsReadStatus
        access={responseSheetAccess}
        load={registrantLoad}
        onReload={onReloadRegistrants}
        sheetCount={attachedSheets.length}
      />

      {registrants.length === 0 ? (
        emptyListText !== undefined && <p className={EMPTY_LIST_CLASSES}>{emptyListText}</p>
      ) : (
        <>
          {/* Only for a sheet whose form asks the question: a list with one
              chip on it would be a control that does nothing. */}
          {attendeeTypes.types.length > 0 && (
            <AttendeeTypeFilter
              filter={attendeeTypeFilter}
              onFilterChange={setChosenAttendeeType}
              summary={attendeeTypes}
              totalCount={registrants.length}
            />
          )}
          <EventRegistrantsTable
            eventRegistrants={registrants}
            isClosedOut={event.isClosedOut}
            members={members}
            onLinkToMember={setLinkingRegistrant}
            registrants={filterByAttendeeType({ registrants, filter: attendeeTypeFilter })}
          />
        </>
      )}

      {linkingRegistrant !== undefined && (
        <LinkToMemberDialog
          errorMessage={linking.errorMessage}
          isBusy={linking.isRunning}
          members={members}
          onCancel={cancelLinking}
          onLink={linkRegistrant}
          registrant={linkingRegistrant}
        />
      )}

      <EventReconcileNotice />
    </article>
  )
}
