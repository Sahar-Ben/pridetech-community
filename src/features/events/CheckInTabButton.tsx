import type { KeyboardEvent, RefObject } from 'react'

const BUTTON_CLASSES =
  'flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-semibold'

const SELECTED_CLASSES =
  'border-indigo-600 bg-indigo-50 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-100'

const UNSELECTED_CLASSES =
  'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'

const COUNT_CLASSES = 'rounded-full bg-white px-2 py-0.5 text-xs dark:bg-slate-900'

/* The space between the label and the count is load-bearing: without it a
   screen reader reads the tab as "Pending35". */

type CheckInTabButtonProps = {
  tabId: string
  panelId: string
  label: string
  count: number
  isSelected: boolean
  onSelect: () => void
  onKeyDown: (keyboardEvent: KeyboardEvent<HTMLButtonElement>) => void
  buttonRef: RefObject<HTMLButtonElement | null>
}

export const CheckInTabButton = ({
  tabId,
  panelId,
  label,
  count,
  isSelected,
  onSelect,
  onKeyDown,
  buttonRef,
}: CheckInTabButtonProps) => (
  <button
    aria-controls={panelId}
    aria-selected={isSelected}
    className={`${BUTTON_CLASSES} ${isSelected ? SELECTED_CLASSES : UNSELECTED_CLASSES}`}
    id={tabId}
    onClick={onSelect}
    onKeyDown={onKeyDown}
    ref={buttonRef}
    role="tab"
    tabIndex={isSelected ? 0 : -1}
    type="button"
  >
    {label}{' '}
    <span className={COUNT_CLASSES}>{count}</span>
  </button>
)
