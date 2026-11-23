import type { Registrant } from './registrant'

const CHECK_GLYPH = '\u{2713}'
const CIRCLE_GLYPH = '\u{25CB}'
const SEPARATOR = ' \u{00b7} '

/* `min-h-16` is the tap target, not decoration: this is used one-handed, on a
   phone, by somebody who is also talking to the person in front of them. The
   whole card is the button.

   Stacked rather than side by side: a name, an address and the state each get
   the full width of the card, so none of them breaks mid-word on a phone. The
   labels sit on top, where the eye lands before the name is read out, and the
   state runs along the bottom.

   Nothing on this row is translucent and nothing on it is display type. It is
   the screen the brief would have kept plain if it could only keep one, so the
   only thing the restyle gave it is a softer corner and a 150ms state change. */
const BUTTON_CLASSES = [
  'flex min-h-16 w-full flex-col gap-1.5 rounded-2xl border-2 px-4 pt-3 text-left',
  'transition-colors duration-150 ease-brand',
].join(' ')

const CHECKED_IN_CLASSES = 'border-arrived-edge bg-arrived-surface'

const UNARRIVED_CLASSES = 'border-edge bg-surface hover:bg-surface-sunken'

const STATE_STRIP_CLASSES =
  '-mx-4 mt-1.5 flex items-center gap-1.5 border-t px-4 py-2.5 text-sm font-bold'

const STATE_STRIP_EDGE_CLASSES = {
  checkedIn: 'border-arrived-edge',
  unarrived: 'border-edge',
} as const

const TAG_CLASSES =
  'rounded-full bg-neutral-surface px-2.5 py-0.5 text-xs font-bold text-neutral-ink'

/* Quiet on purpose: at a members-only door this is the one row in twenty that
   needs a second look, and a loud badge on it would train the eye to skip it. */
const MEMBER_MARKER_CLASSES =
  'rounded-full border border-warning-edge px-2.5 py-0.5 text-xs font-bold text-warning-ink'

/* Loud on purpose, unlike the member marker: it is the one tag on the row that
   changes what the person at the door says, and it should be seen before the
   name is read out. */
const FIRST_EVENT_BADGE_CLASSES =
  'rounded-full bg-accent-solid px-2.5 py-0.5 text-xs font-bold text-on-accent'

const STATE_CLASSES = {
  checkedIn: 'text-arrived-ink',
  unarrived: 'text-ink-muted',
} as const

type CheckInPersonButtonProps = {
  registrant: Registrant
  memberMarker: string | undefined
  isFirstEvent: boolean
  onToggle: (registrantId: string) => void
}

export const CheckInPersonButton = ({
  registrant,
  memberMarker,
  isFirstEvent,
  onToggle,
}: CheckInPersonButtonProps) => {
  const isCheckedIn = registrant.checkedInAt !== undefined

  const hasLabels =
    isFirstEvent ||
    registrant.attendeeType !== undefined ||
    registrant.registration === 'waitlist' ||
    registrant.isWalkIn ||
    memberMarker !== undefined

  /* The name comes first in the markup, so a screen reader announces the
     person before their labels; `order-first` only moves the labels up on
     screen. */
  return (
    <button
      aria-pressed={isCheckedIn}
      className={`${BUTTON_CLASSES} ${isCheckedIn ? CHECKED_IN_CLASSES : UNARRIVED_CLASSES}`}
      onClick={() => onToggle(registrant.id)}
      type="button"
    >
      <span className="text-lg leading-tight font-bold wrap-anywhere text-ink">
        {registrant.name}
      </span>
      <span className="text-sm wrap-anywhere text-ink-muted">
        {registrant.email ?? 'No email on this sheet'}
      </span>
      {hasLabels && (
        <span className="order-first flex flex-wrap gap-1.5">
          {isFirstEvent && (
            <span className={FIRST_EVENT_BADGE_CLASSES}>
              <span aria-hidden="true">{'\u{2605}'} </span>
              First event
            </span>
          )}
          {registrant.attendeeType !== undefined && (
            <span className={`${TAG_CLASSES} wrap-anywhere`}>{registrant.attendeeType}</span>
          )}
          {registrant.registration === 'waitlist' && <span className={TAG_CLASSES}>Waitlist</span>}
          {registrant.isWalkIn && <span className={TAG_CLASSES}>Walk-in</span>}
          {memberMarker !== undefined && (
            <span className={MEMBER_MARKER_CLASSES}>{memberMarker}</span>
          )}
        </span>
      )}

      <span
        className={`${STATE_STRIP_CLASSES} ${
          isCheckedIn
            ? `${STATE_STRIP_EDGE_CLASSES.checkedIn} ${STATE_CLASSES.checkedIn}`
            : `${STATE_STRIP_EDGE_CLASSES.unarrived} ${STATE_CLASSES.unarrived}`
        }`}
      >
        <span aria-hidden="true" className="text-lg leading-none">
          {isCheckedIn ? CHECK_GLYPH : CIRCLE_GLYPH}
        </span>
        {isCheckedIn ? `Checked in${SEPARATOR}tap to undo` : 'Tap to check in'}
      </span>
    </button>
  )
}
