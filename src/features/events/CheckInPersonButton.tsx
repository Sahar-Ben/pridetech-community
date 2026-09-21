import type { Registrant } from './registrant'

const CHECK_GLYPH = '\u{2713}'
const CIRCLE_GLYPH = '\u{25CB}'
const SEPARATOR = ' \u{00b7} '

/* `min-h-16` is the tap target, not decoration: this is used one-handed, on a
   phone, by somebody who is also talking to the person in front of them. */
const BUTTON_CLASSES =
  'flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 text-left'

const CHECKED_IN_CLASSES =
  'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950'

const UNARRIVED_CLASSES =
  'border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'

const TAG_CLASSES =
  'rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300'

/* Quiet on purpose: at a members-only door this is the one row in twenty that
   needs a second look, and a loud badge on it would train the eye to skip it. */
const MEMBER_MARKER_CLASSES =
  'rounded-full border border-amber-400 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-700 dark:text-amber-400'

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
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-semibold break-words text-slate-900 dark:text-slate-100">
          {registrant.name}
        </span>
        <span className="text-xs break-words text-slate-500 dark:text-slate-400">
          {registrant.email ?? 'No email on this sheet'}
        </span>
        <span className="flex flex-wrap gap-1">
          {registrant.registration === 'waitlist' && <span className={TAG_CLASSES}>Waitlist</span>}
          {registrant.isWalkIn && <span className={TAG_CLASSES}>Walk-in</span>}
          {memberMarker !== undefined && (
            <span className={MEMBER_MARKER_CLASSES}>{memberMarker}</span>
          )}
        </span>
      </span>

      <span
        className={`flex shrink-0 items-center gap-1.5 text-sm font-semibold ${
          isCheckedIn
            ? 'text-emerald-800 dark:text-emerald-300'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <span aria-hidden="true">{isCheckedIn ? CHECK_GLYPH : CIRCLE_GLYPH}</span>
        {isCheckedIn ? `Checked in${SEPARATOR}tap to undo` : 'Tap to check in'}
      </span>
    </button>
  )
}
