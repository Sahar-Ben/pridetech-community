import { useState } from 'react'
import { LocalOnlySaveNotice } from '../members/LocalOnlySaveNotice'
import { EventReconcileNotice } from './EventReconcileNotice'
import { EventRegistrantsTable } from './EventRegistrantsTable'
import { describeAttendanceForEvent } from './eventAttendanceText'
import { formatEventDate } from './eventDate'
import { summariseEventAttendance } from './eventAttendance'
import {
  COMPACT_BUTTON_SIZE_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
  TOUCH_BUTTON_SIZE_CLASSES,
} from '../../theme/controls'
import type { CommunityEvent } from './communityEvent'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'
import { DATA_PANEL_CLASSES, RECORD_TITLE_CLASSES } from '../../theme/surfaces'

const BACK_ARROW = '\u{2190}'
const SEPARATOR = ' \u{00b7} '

const CHECK_IN_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

const SECONDARY_ACTION_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const DETAIL_CLASSES = `${DATA_PANEL_CLASSES} animate-rise flex flex-col gap-4 px-4 py-4 sm:px-6`

type EventDetailProps = {
  event: CommunityEvent
  registrants: readonly Registrant[]
  members: readonly Member[]
  onBack: () => void
  onOpenCheckIn: () => void
  onCloseOut: () => void
}

export const EventDetail = ({
  event,
  registrants,
  members,
  onBack,
  onOpenCheckIn,
  onCloseOut,
}: EventDetailProps) => {
  const [wasClosedOutLocally, setWasClosedOutLocally] = useState(false)
  const summary = summariseEventAttendance({ registrants, isClosedOut: event.isClosedOut })

  const closeOutEvent = () => {
    onCloseOut()
    setWasClosedOutLocally(true)
  }

  return (
    <article className={DETAIL_CLASSES}>
      <button className={`${SECONDARY_ACTION_CLASSES} self-start`} onClick={onBack} type="button">
        <span aria-hidden="true">{BACK_ARROW} </span>
        Back to events
      </button>

      <div className="flex flex-col gap-1">
        <h3 className={RECORD_TITLE_CLASSES}>{event.name}</h3>
        <p className="text-sm text-ink">
          {formatEventDate(event.date)}
          {SEPARATOR}
          {event.location}
        </p>
        {event.host !== undefined && (
          <p className="text-sm text-ink">Hosted by {event.host}</p>
        )}
        <p className="text-sm text-ink">
          {event.isMembersOnly
            ? 'Members only. The door warns before admitting somebody who is not in the member list.'
            : 'Open to non-members.'}
        </p>
        <p className="text-sm font-bold text-ink">
          {describeAttendanceForEvent(summary)}
        </p>
        {/* The figures above are the ones that could be believed. They are
            invented, and a check-in made in this app never leaves the tab. */}
        <p className="text-xs font-semibold text-warning-ink">
          Sample data: these registrants are invented, and the attendance shown here has never
          been recorded anywhere. Check-ins made in this app are lost when the page reloads.
        </p>
      </div>

      <div aria-live="polite">{wasClosedOutLocally && <LocalOnlySaveNotice />}</div>

      <div className="flex flex-wrap items-center gap-3">
        {event.isClosedOut ? (
          <p className="text-sm text-ink">
            Closed out. This is the final attendance for the event.
          </p>
        ) : (
          <>
            <button className={CHECK_IN_BUTTON_CLASSES} onClick={onOpenCheckIn} type="button">
              Check in at the door
            </button>
            <button className={SECONDARY_ACTION_CLASSES} onClick={closeOutEvent} type="button">
              Close out attendance
            </button>
            <p className="text-xs text-ink-muted">
              Closing out records this as the final attendance, so do it after the door shuts.
            </p>
          </>
        )}
      </div>

      {registrants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-edge px-4 py-10 text-center text-sm text-ink-muted">
          No registrants. Nothing has been read from a response sheet for this event.
        </p>
      ) : (
        <EventRegistrantsTable
          isClosedOut={event.isClosedOut}
          members={members}
          registrants={registrants}
        />
      )}

      <EventReconcileNotice />
    </article>
  )
}
