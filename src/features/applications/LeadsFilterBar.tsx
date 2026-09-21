import { useId } from 'react'
import { LEAD_VIEWS, type LeadView } from './leadViews'
import { FIELD_BORDER_CLASSES, FIELD_CONTROL_CLASSES } from '../../theme/fields'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

/* The same control the Members screen carries, in the same place and on the
   same panel: the organiser moves between the two screens all day, and a second
   pattern here would be a second thing to learn.

   The panel is what lets the control follow the cards below it off white. A
   bare select on the gradient would have been the only pale slab left on the
   screen, and its border could not have cleared 3:1 against both its own fill
   and the gradient's lightest point. */
const BAR_CLASSES = `${WORK_PANEL_CLASSES} flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-end`

const LABEL_CLASSES = 'text-xs font-bold tracking-wide text-ink uppercase'

const CONTROL_CLASSES = `${FIELD_CONTROL_CLASSES} ${FIELD_BORDER_CLASSES}`

const isLeadView = (value: string): value is LeadView =>
  LEAD_VIEWS.some((leadView) => leadView === value)

type LeadsFilterBarProps = {
  view: LeadView
  onViewChange: (view: LeadView) => void
}

export const LeadsFilterBar = ({ view, onViewChange }: LeadsFilterBarProps) => {
  const statusSelectId = useId()

  return (
    <div className={BAR_CLASSES}>
      <div className="flex flex-col gap-1 sm:w-44">
        <label className={LABEL_CLASSES} htmlFor={statusSelectId}>
          Status
        </label>
        <select
          className={CONTROL_CLASSES}
          id={statusSelectId}
          onChange={(event) => {
            const selected = event.target.value
            if (isLeadView(selected)) {
              onViewChange(selected)
            }
          }}
          value={view}
        >
          {LEAD_VIEWS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
