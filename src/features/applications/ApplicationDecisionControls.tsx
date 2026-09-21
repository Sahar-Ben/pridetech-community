import { useId, useState } from 'react'
import type { ApprovalDecision, DeclineDecision, Gender } from './decision'
import type { Lead } from './lead'
import {
  COMPACT_BUTTON_SIZE_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from '../../theme/controls'
import { FIELD_BORDER_CLASSES, FIELD_LABEL_CLASSES } from '../../theme/fields'

const GENDER_SELECT_CLASSES = `rounded-xl border bg-surface px-2.5 py-1.5 text-sm text-ink disabled:opacity-50 ${FIELD_BORDER_CLASSES}`

const APPROVE_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const DECLINE_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'F', label: 'F' },
  { value: 'M', label: 'M' },
]

const isGender = (value: string): value is Gender =>
  GENDER_OPTIONS.some((option) => option.value === value)

/* `onDecline` is absent on an application that was already declined, and the
   button goes with it: the list it is being read from is the record of that
   decision, so the only act left on it is the one that reverses it. */
type ApplicationDecisionControlsProps = {
  lead: Lead
  isSaving: boolean
  onApprove: (decision: ApprovalDecision) => void
  onDecline: ((decision: DeclineDecision) => void) | undefined
}

export const ApplicationDecisionControls = ({
  lead,
  isSaving,
  onApprove,
  onDecline,
}: ApplicationDecisionControlsProps) => {
  const genderSelectId = useId()
  const [gender, setGender] = useState<Gender>('unknown')

  return (
    <div className="flex shrink-0 items-center gap-2">
      <label className={FIELD_LABEL_CLASSES} htmlFor={genderSelectId}>
        Gender
      </label>
      <select
        className={GENDER_SELECT_CLASSES}
        disabled={isSaving}
        id={genderSelectId}
        value={gender}
        onChange={(event) => {
          const selected = event.target.value
          if (isGender(selected)) {
            setGender(selected)
          }
        }}
      >
        {GENDER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        className={APPROVE_BUTTON_CLASSES}
        disabled={isSaving}
        type="button"
        onClick={() => onApprove({ lead, gender })}
      >
        {isSaving ? 'Saving...' : 'Approve'}
      </button>
      {onDecline !== undefined && (
        <button
          className={DECLINE_BUTTON_CLASSES}
          disabled={isSaving}
          type="button"
          onClick={() => onDecline({ lead })}
        >
          Decline
        </button>
      )}
    </div>
  )
}
