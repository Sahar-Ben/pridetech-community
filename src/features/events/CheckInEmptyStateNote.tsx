import { SECONDARY_BUTTON_CLASSES, TOUCH_BUTTON_SIZE_CLASSES } from './eventButtonStyles'
import type { CheckInEmptyState, CheckInTab } from './checkInBoard'
import type { Registrant } from './registrant'

const NOTE_CLASSES =
  'flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400'

const HEADLINE_CLASSES = 'text-base font-semibold text-slate-900 dark:text-slate-100'

const SHOW_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

const EMPTY_TAB_MESSAGES: Readonly<Record<CheckInTab, string>> = {
  pending: 'Everybody on the list has arrived.',
  arrived: 'Nobody has been checked in yet.',
}

/* What the organiser is actually asking when the list comes back empty is
   "where is this person", and the two answers are not interchangeable: one
   sends them to a walk-in, the other means wave them through. */
const OTHER_TAB_HEADLINES: Readonly<Record<CheckInTab, string>> = {
  pending: 'Already checked in',
  arrived: 'Not arrived yet',
}

const OTHER_TAB_EXPLANATIONS: Readonly<Record<CheckInTab, string>> = {
  pending: 'They are on the Arrived list.',
  arrived: 'They are still on the Pending list.',
}

const OTHER_TAB_BUTTONS: Readonly<Record<CheckInTab, string>> = {
  pending: 'Show in Arrived',
  arrived: 'Show in Pending',
}

const toNameList = (matches: readonly Registrant[]): string =>
  matches.map((registrant) => registrant.name).join(', ')

type CheckInEmptyStateNoteProps = {
  emptyState: CheckInEmptyState
  activeTab: CheckInTab
  onShowOtherTab: () => void
}

export const CheckInEmptyStateNote = ({
  emptyState,
  activeTab,
  onShowOtherTab,
}: CheckInEmptyStateNoteProps) => {
  if (emptyState.kind === 'empty-tab') {
    return <p className={NOTE_CLASSES}>{EMPTY_TAB_MESSAGES[activeTab]}</p>
  }

  if (emptyState.kind === 'no-match') {
    return (
      <p className={NOTE_CLASSES}>
        Nobody on the list matches that. Try fewer letters, or add them as a walk-in.
      </p>
    )
  }

  return (
    <div className={NOTE_CLASSES}>
      <span className={HEADLINE_CLASSES}>
        {OTHER_TAB_HEADLINES[activeTab]}: {toNameList(emptyState.matches)}
      </span>
      <span>{OTHER_TAB_EXPLANATIONS[activeTab]}</span>
      <button className={SHOW_BUTTON_CLASSES} onClick={onShowOtherTab} type="button">
        {OTHER_TAB_BUTTONS[activeTab]}
      </button>
    </div>
  )
}
