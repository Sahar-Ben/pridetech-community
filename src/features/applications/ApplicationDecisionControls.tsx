import { useId, useState } from 'react'
import type { ApprovalDecision, DeclineDecision, Gender, MaybeDecision } from './decision'
import type { Lead } from './lead'
import {
  COMPACT_BUTTON_SIZE_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from '../../theme/controls'
import { FIELD_BORDER_CLASSES, FIELD_LABEL_CLASSES } from '../../theme/fields'

const GENDER_SELECT_CLASSES = `rounded-xl border bg-surface px-2.5 py-1.5 text-sm text-ink disabled:opacity-50 ${FIELD_BORDER_CLASSES}`

const APPROVE_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const SECONDARY_DECISION_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

/* Wraps below `sm`, where a third decision no longer fits on one line beside
   the gender select; from `sm` up the row keeps its width, so the applicant's
   details take the space instead. */
const CONTROL_ROW_CLASSES = 'flex flex-wrap items-center gap-2 sm:shrink-0'

const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'F', label: 'F' },
  { value: 'M', label: 'M' },
]

const isGender = (value: string): value is Gender =>
  GENDER_OPTIONS.some((option) => option.value === value)

/* A handler is absent wherever its decision is not on offer, and the button
   goes with it: the list an application is being read from is the record of a
   decision already taken, so what is left on the card is only what would change
   it. `onDecline` is gone under Declined, `onMarkMaybe` everywhere but the
   queue. */
type ApplicationDecisionControlsProps = {
  lead: Lead
  isSaving: boolean
  onApprove: (decision: ApprovalDecision) => void
  decisions: {
    onDecline: ((decision: DeclineDecision) => void) | undefined
    onMarkMaybe: ((decision: MaybeDecision) => void) | undefined
  }
}

export const ApplicationDecisionControls = ({
  lead,
  isSaving,
  onApprove,
  decisions,
}: ApplicationDecisionControlsProps) => {
  const { onDecline, onMarkMaybe } = decisions
  const genderSelectId = useId()
  const [gender, setGender] = useState<Gender>('unknown')

  return (
    <div className={CONTROL_ROW_CLASSES}>
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
      {onMarkMaybe !== undefined && (
        <button
          className={SECONDARY_DECISION_BUTTON_CLASSES}
          disabled={isSaving}
          type="button"
          onClick={() => onMarkMaybe({ lead })}
        >
          Maybe
        </button>
      )}
      {onDecline !== undefined && (
        <button
          className={SECONDARY_DECISION_BUTTON_CLASSES}
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
