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
} from './eventButtonStyles'
import type { CommunityEvent } from './communityEvent'
import type { Member } from '../members/member'
import type { Registrant } from './registrant'

const BACK_ARROW = '\u{2190}'
const SEPARATOR = ' \u{00b7} '

const CHECK_IN_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

const SECONDARY_ACTION_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

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
    <article className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
      <button className={`${SECONDARY_ACTION_CLASSES} self-start`} onClick={onBack} type="button">
        <span aria-hidden="true">{BACK_ARROW} </span>
        Back to events
      </button>

      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{event.name}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {formatEventDate(event.date)}
          {SEPARATOR}
          {event.location}
        </p>
        {event.host !== undefined && (
          <p className="text-sm text-slate-600 dark:text-slate-400">Hosted by {event.host}</p>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {event.isMembersOnly
            ? 'Members only. The door warns before admitting somebody who is not in the member list.'
            : 'Open to non-members.'}
        </p>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {describeAttendanceForEvent(summary)}
        </p>
        {/* The figures above are the ones that could be believed. They are
            invented, and a check-in made in this app never leaves the tab. */}
        <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
          Sample data: these registrants are invented, and the attendance shown here has never
          been recorded anywhere. Check-ins made in this app are lost when the page reloads.
        </p>
      </div>

      <div aria-live="polite">{wasClosedOutLocally && <LocalOnlySaveNotice />}</div>

      <div className="flex flex-wrap items-center gap-3">
        {event.isClosedOut ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Closing out records this as the final attendance, so do it after the door shuts.
            </p>
          </>
        )}
      </div>

      {registrants.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
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
