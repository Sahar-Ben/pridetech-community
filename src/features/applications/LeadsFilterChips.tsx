import { useRef, type KeyboardEvent } from 'react'
import {
  LEAD_VIEWS,
  findViewForArrowKey,
  selectCountInView,
  toViewChipId,
  type LeadView,
} from './leadViews'
import type { LeadsReviewCounts } from './leadsReview'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

/* A segmented control: three equal cells in one card, the chosen one filled
   with the accent. */
const BAR_CLASSES = `${WORK_PANEL_CLASSES} grid grid-cols-3 gap-1 rounded-[18px] p-1`

const CHIP_CLASSES = [
  'flex min-h-[46px] items-center justify-center gap-1.5 rounded-[14px] border px-1',
  'text-sm font-semibold transition-colors duration-150 ease-brand',
].join(' ')

const SELECTED_CHIP_CLASSES = 'border-accent-solid bg-accent-solid text-on-accent'

const UNSELECTED_CHIP_CLASSES =
  'border-transparent bg-transparent text-neutral-ink hover:bg-surface'

/* The count is re-inked per state: dark on the accent fill, faint grey on the
   card (5.3:1). */
const COUNT_CLASSES = 'rounded-full px-1.5 py-0.5 font-mono text-[11px] font-medium'

const SELECTED_COUNT_CLASSES = 'bg-on-accent/15 text-on-accent'

const UNSELECTED_COUNT_CLASSES = 'text-ink-faint'

type LeadsFilterChipsProps = {
  baseId: string
  panelId: string
  view: LeadView
  counts: LeadsReviewCounts
  onViewChange: (view: LeadView) => void
}

export const LeadsFilterChips = ({
  baseId,
  panelId,
  view,
  counts,
  onViewChange,
}: LeadsFilterChipsProps) => {
  const chipRefs = useRef(new Map<LeadView, HTMLButtonElement>())

  /* Selection follows focus, which is what makes an arrow key a way of reading
     another list rather than a two-step commitment. */
  const selectAndFocusView = (nextView: LeadView) => {
    onViewChange(nextView)
    chipRefs.current.get(nextView)?.focus()
  }

  const moveOnArrowKey = (keyboardEvent: KeyboardEvent<HTMLButtonElement>) => {
    const nextView = findViewForArrowKey({ key: keyboardEvent.key, view })
    if (nextView === undefined) {
      return
    }
    keyboardEvent.preventDefault()
    selectAndFocusView(nextView)
  }

  return (
    <div aria-label="Application status" className={BAR_CLASSES} role="tablist">
      {LEAD_VIEWS.map((option) => {
        const isSelected = option === view
        const chipClasses = isSelected ? SELECTED_CHIP_CLASSES : UNSELECTED_CHIP_CLASSES
        const countClasses = isSelected ? SELECTED_COUNT_CLASSES : UNSELECTED_COUNT_CLASSES
        return (
          <button
            aria-controls={panelId}
            aria-selected={isSelected}
            className={`${CHIP_CLASSES} ${chipClasses}`}
            id={toViewChipId({ baseId, view: option })}
            key={option}
            onClick={() => onViewChange(option)}
            onKeyDown={moveOnArrowKey}
            ref={(chip) => {
              if (chip === null) {
                chipRefs.current.delete(option)
                return
              }
              chipRefs.current.set(option, chip)
            }}
            role="tab"
            tabIndex={isSelected ? 0 : -1}
            type="button"
          >
            {/* The space before the count is load-bearing: without it a screen
                reader reads the chip as "Declined12". */}
            {option}{' '}
            <span className={`${COUNT_CLASSES} ${countClasses}`}>
              {selectCountInView({ counts, view: option })}
            </span>
          </button>
        )
      })}
    </div>
  )
}
