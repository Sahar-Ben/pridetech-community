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
  onArchive: (event: CommunityEvent) => void
}

export const EventRow = ({ event, attendanceText, onOpen, onEdit, onArchive }: EventRowProps) => (
  <li className={ROW_CLASSES}>
    <div className="min-w-0 space-y-1">
      <h4 className="text-base font-bold">
        <button
          className="rounded text-left text-ink underline-offset-2 hover:underline"
          onClick={() => onOpen(event)}
          type="button"
        >
          {event.name}
        </button>
      </h4>
      <p className="text-sm text-ink">
        {formatEventDate(event.date)}
        {SEPARATOR}
        {event.location}
      </p>
      {event.host !== undefined && (
        <p className="text-xs text-ink-muted">Hosted by {event.host}</p>
      )}
      <p className="text-xs font-semibold text-ink">{attendanceText}</p>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      <button
        aria-label={`Edit ${event.name}`}
        className={ROW_BUTTON_CLASSES}
        onClick={() => onEdit(event)}
        type="button"
      >
        Edit
      </button>
      <button
        aria-label={`Archive ${event.name}`}
        className={ROW_BUTTON_CLASSES}
        onClick={() => onArchive(event)}
        type="button"
      >
        Archive
      </button>
    </div>
  </li>
)
