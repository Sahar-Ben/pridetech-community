import { useId } from 'react'
import { LEAD_VIEWS, type LeadView } from './leadViews'
import { FIELD_BORDER_CLASSES, FIELD_CONTROL_CLASSES } from '../../theme/fields'

/* The same control the Members screen carries, in the same place and the same
   white-on-gradient label: the organiser moves between the two screens all day,
   and a second pattern here would be a second thing to learn. */
const LABEL_CLASSES = 'text-xs font-bold tracking-wide text-on-brand uppercase'

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
