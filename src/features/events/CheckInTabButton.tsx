import type { KeyboardEvent, RefObject } from 'react'

/* Tighter on the smallest phones, where two tabs side by side are about 120px
   each: with the roomier padding the word itself was broken in two
   ("Pendin / g"). The label never wraps. */
const BUTTON_CLASSES = [
  'flex min-h-14 flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 px-2 py-2',
  'text-[15px] font-bold whitespace-nowrap transition-colors duration-150 ease-brand',
  'min-[360px]:gap-2 min-[360px]:px-4 min-[360px]:text-base',
].join(' ')

/* Filled, not tinted. At a door the question "which list am I looking at" has
   to be answerable from a glance at arm's length, and an outline against a tint
   is not an answer in bad light. */
const SELECTED_CLASSES = 'border-accent-solid bg-accent-solid text-on-accent'

const UNSELECTED_CLASSES = 'border-edge bg-surface text-ink hover:bg-surface-sunken'

/* The ring, not the fill, is what keeps the count visible: on the selected tab
   this pill sits on solid accent, on the unselected one it sits on the same
   surface it is filled with. */
const COUNT_CLASSES = [
  'rounded-full bg-surface-raised px-2 py-0.5 text-sm font-bold text-ink min-[360px]:px-2.5',
  'ring-1 ring-edge/60 ring-inset',
].join(' ')

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
    {label} <span className={COUNT_CLASSES}>{count}</span>
  </button>
)
