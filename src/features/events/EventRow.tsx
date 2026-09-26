import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'
import { DATA_PANEL_CLASSES } from '../../theme/surfaces'
import { formatEventDate } from './eventDate'
import type { CommunityEvent } from './communityEvent'

const SEPARATOR = ' \u{00b7} '

const ROW_CLASSES = [
  DATA_PANEL_CLASSES,
  'flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between',
  'transition-shadow duration-200 ease-brand hover:shadow-lift',
].join(' ')

const ROW_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type EventRowProps = {
  event: CommunityEvent
  attendanceText: string
  onOpen: (event: CommunityEvent) => void
  onEdit: (event: CommunityEvent) => void
}

export const EventRow = ({ event, attendanceText, onOpen, onEdit }: EventRowProps) => (
  <li className={ROW_CLASSES}>
    <div className="min-w-0 space-y-1">
      <h4 className="flex flex-wrap items-center gap-2 text-base font-bold">
        <button
          className="rounded text-left text-ink underline-offset-2 hover:underline"
          onClick={() => onOpen(event)}
          type="button"
        >
          {event.name}
        </button>
        {/* Closed out at the door: the attendance below is final. */}
        {event.isClosedOut && (
          <span className="rounded-full bg-neutral-surface px-2.5 py-0.5 text-xs font-bold text-neutral-ink ring-1 ring-neutral-ink/25 ring-inset">
            Closed
          </span>
        )}
      </h4>
      <p className="text-sm text-ink">
        {formatEventDate(event.date)}
        {event.location !== '' && (
          <>
            {SEPARATOR}
            {event.location}
          </>
        )}
      </p>
      {event.host !== undefined && (
        <p className="text-xs text-ink-muted">Hosted by {event.host}</p>
      )}
      <p className="text-xs font-semibold text-ink">{attendanceText}</p>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      {/* The name above opens the event too, but it does not look like it
          does until it is hovered, and a phone has no hover. */}
      <button
        aria-label={`Open ${event.name}`}
        className={ROW_BUTTON_CLASSES}
        onClick={() => onOpen(event)}
        type="button"
      >
        Open
      </button>
      <button
        aria-label={`Edit ${event.name}`}
        className={ROW_BUTTON_CLASSES}
        onClick={() => onEdit(event)}
        type="button"
      >
        Edit
      </button>
    </div>
  </li>
)
