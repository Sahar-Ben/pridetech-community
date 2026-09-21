import type { Registrant } from './registrant'

const CHECK_GLYPH = '\u{2713}'
const CIRCLE_GLYPH = '\u{25CB}'
const SEPARATOR = ' \u{00b7} '

/* `min-h-16` is the tap target, not decoration: this is used one-handed, on a
   phone, by somebody who is also talking to the person in front of them.

   Nothing on this row is translucent and nothing on it is display type. It is
   the screen the brief would have kept plain if it could only keep one, so the
   only thing the restyle gave it is a softer corner and a 150ms state change. */
const BUTTON_CLASSES = [
  'flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left',
  'transition-colors duration-150 ease-brand',
].join(' ')

const CHECKED_IN_CLASSES = 'border-arrived-edge bg-arrived-surface'

const UNARRIVED_CLASSES = 'border-edge bg-surface hover:bg-surface-sunken'

const TAG_CLASSES =
  'rounded-full bg-neutral-surface px-2.5 py-0.5 text-xs font-bold text-neutral-ink'

/* Quiet on purpose: at a members-only door this is the one row in twenty that
   needs a second look, and a loud badge on it would train the eye to skip it. */
const MEMBER_MARKER_CLASSES =
  'rounded-full border border-warning-edge px-2.5 py-0.5 text-xs font-bold text-warning-ink'

const STATE_CLASSES = {
  checkedIn: 'text-arrived-ink',
  unarrived: 'text-ink-muted',
} as const

type CheckInPersonButtonProps = {
  registrant: Registrant
  memberMarker: string | undefined
  onToggle: (registrantId: string) => void
}

export const CheckInPersonButton = ({
  registrant,
  memberMarker,
  onToggle,
}: CheckInPersonButtonProps) => {
  const isCheckedIn = registrant.checkedInAt !== undefined

  return (
    <button
      aria-pressed={isCheckedIn}
      className={`${BUTTON_CLASSES} ${isCheckedIn ? CHECKED_IN_CLASSES : UNARRIVED_CLASSES}`}
      onClick={() => onToggle(registrant.id)}
      type="button"
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-lg leading-tight font-bold break-words text-ink">
          {registrant.name}
        </span>
        <span className="text-sm break-words text-ink-muted">
          {registrant.email ?? 'No email on this sheet'}
        </span>
        <span className="flex flex-wrap gap-1.5">
          {registrant.registration === 'waitlist' && <span className={TAG_CLASSES}>Waitlist</span>}
          {registrant.isWalkIn && <span className={TAG_CLASSES}>Walk-in</span>}
          {memberMarker !== undefined && (
            <span className={MEMBER_MARKER_CLASSES}>{memberMarker}</span>
          )}
        </span>
      </span>

      <span
        className={`flex shrink-0 items-center gap-1.5 text-sm font-bold ${
          isCheckedIn ? STATE_CLASSES.checkedIn : STATE_CLASSES.unarrived
        }`}
      >
        <span aria-hidden="true" className="text-lg">
          {isCheckedIn ? CHECK_GLYPH : CIRCLE_GLYPH}
        </span>
        {isCheckedIn ? `Checked in${SEPARATOR}tap to undo` : 'Tap to check in'}
      </span>
    </button>
  )
}
