import { COMPACT_BUTTON_SIZE_CLASSES, SECONDARY_BUTTON_CLASSES } from './eventButtonStyles'
import { formatEventDate } from './eventDate'
import type { CommunityEvent } from './communityEvent'

const SEPARATOR = ' \u{00b7} '

const ROW_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type EventRowProps = {
  event: CommunityEvent
  attendanceText: string
  onOpen: (event: CommunityEvent) => void
  onEdit: (event: CommunityEvent) => void
  onArchive: (event: CommunityEvent) => void
}

export const EventRow = ({ event, attendanceText, onOpen, onEdit, onArchive }: EventRowProps) => (
  <li className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
    <div className="min-w-0 space-y-1">
      <h4 className="text-base font-semibold">
        <button
          className="rounded text-left text-slate-900 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-slate-100"
          onClick={() => onOpen(event)}
          type="button"
        >
          {event.name}
        </button>
      </h4>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {formatEventDate(event.date)}
        {SEPARATOR}
        {event.location}
      </p>
      {event.host !== undefined && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Hosted by {event.host}</p>
      )}
      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{attendanceText}</p>
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
