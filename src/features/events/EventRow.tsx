import { SECONDARY_BUTTON_CLASSES } from '../../theme/controls'
import { DATA_PANEL_CLASSES } from '../../theme/surfaces'
import { formatEventDate } from './eventDate'
import type { CommunityEvent } from './communityEvent'

const SEPARATOR = ' \u{00b7} '

const ROW_CLASSES = [
  DATA_PANEL_CLASSES,
  'flex flex-col gap-3.5 rounded-[var(--radius-brand)] p-[18px] sm:flex-row sm:items-center sm:justify-between',
  'transition-shadow duration-200 ease-brand hover:shadow-lift',
].join(' ')

const DATE_TILE_CLASSES = [
  'flex size-[52px] shrink-0 flex-col items-center justify-center rounded-[15px]',
  'border border-card-strong-edge bg-nav-active leading-none',
].join(' ')

/* The day and month off the spelled-out date, for the tile beside the name.
   A date the sheet holds in some other shape gets no tile rather than a wrong one. */
const dateTileParts = (isoDate: string): { day: string; month: string } | undefined => {
  const [day, month] = formatEventDate(isoDate).split(' ')
  if (day === undefined || month === undefined || !/^\d+$/.test(day)) {
    return undefined
  }
  return { day, month }
}

const ROW_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} min-h-11 px-5 text-sm`

type EventRowProps = {
  event: CommunityEvent
  attendanceText: string
  onOpen: (event: CommunityEvent) => void
  onEdit: (event: CommunityEvent) => void
}

export const EventRow = ({ event, attendanceText, onOpen, onEdit }: EventRowProps) => {
  const tile = dateTileParts(event.date)

  return (
    <li className={ROW_CLASSES}>
      <div className="flex min-w-0 items-start gap-3">
        {tile !== undefined && (
          <span aria-hidden="true" className={DATE_TILE_CLASSES}>
            <span className="text-xl font-semibold text-ink">{tile.day}</span>
            <span className="mt-1 font-mono text-[10px] tracking-[0.12em] text-accent uppercase">
              {tile.month}
            </span>
          </span>
        )}
        <div className="min-w-0 space-y-1">
          <h4 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-[-0.01em]">
            <button
              className="rounded text-left text-ink underline-offset-2 hover:underline"
              onClick={() => onOpen(event)}
              type="button"
            >
              {event.name}
            </button>
            {/* Closed out at the door: the attendance below is final. */}
            {event.isClosedOut && (
              <span className="rounded-full bg-neutral-surface px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-[0.08em] text-neutral-ink uppercase ring-1 ring-card-strong-edge ring-inset">
                Closed
              </span>
            )}
          </h4>
          <p className="text-sm text-ink-muted">
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
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
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
}
