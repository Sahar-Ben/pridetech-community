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

/* The panel is what lets these follow the cards below them off white. A bare
   row of chips on the gradient would be the only pale slab left on the screen,
   and their borders could not have cleared 3:1 against both their own fill and
   the gradient's lightest point. */
const BAR_CLASSES = `${WORK_PANEL_CLASSES} flex flex-wrap gap-2 px-3 py-2.5`

const CHIP_CLASSES = [
  'flex items-center gap-2 rounded-full border px-3.5 py-1.5',
  'text-sm font-semibold transition-colors duration-150 ease-brand',
].join(' ')

const SELECTED_CHIP_CLASSES = 'border-accent-solid bg-accent-solid text-on-accent'

const UNSELECTED_CHIP_CLASSES = 'border-edge bg-surface text-ink hover:bg-surface-sunken'

/* The count pill is re-inked per state rather than styled once. Measured: one
   pill style for both leaves the selected chip's count at 1.68:1, because the
   panel points `surface-raised` and `ink` at a translucent white on a dark
   panel and the selected chip is a light accent fill. Each state carries the
   ink its own fill can hold. */
const COUNT_CLASSES = 'rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset'

const SELECTED_COUNT_CLASSES = 'bg-on-accent/15 text-on-accent ring-on-accent/25'

const UNSELECTED_COUNT_CLASSES = 'bg-surface-raised text-ink ring-edge/60'

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
