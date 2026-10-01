import { useId, useRef, useState } from 'react'
import type { ApprovalDecision, DeclineDecision, Gender, MaybeDecision } from './decision'
import { DecisionReasonDialog } from './DecisionReasonDialog'
import type { ReasonedDecisionKind } from './decisionReason'
import type { Lead } from './lead'
import { PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'
import { FIELD_BORDER_CLASSES, FIELD_LABEL_CLASSES } from '../../theme/fields'

const GENDER_SELECT_CLASSES = `h-11 w-[186px] rounded-[14px] border bg-surface-sunken px-3 text-base text-ink disabled:opacity-50 ${FIELD_BORDER_CLASSES}`

const DECISION_SIZE_CLASSES = 'min-h-[52px] px-2 text-[15px]'

const APPROVE_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${DECISION_SIZE_CLASSES}`

const MAYBE_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${DECISION_SIZE_CLASSES} bg-transparent`

/* Decline wears the danger ink so it cannot be mistaken for its neighbour; it
   still asks for a reason before anything is written. */
const DECLINE_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${DECISION_SIZE_CLASSES} border-danger-edge bg-transparent text-danger-ink hover:bg-danger-surface`

const CONTROL_STACK_CLASSES = 'flex flex-col gap-3.5'

/* Approve gets the widest cell and comes first, so it sits under the thumb's
   natural reach on the left and is the first decision a keyboard reaches. */
const DECISION_ROW_CLASSES = 'grid grid-cols-[1.5fr_1fr_1fr] gap-2'

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
    onDecline: ((decision: DeclineDecision) => Promise<void>) | undefined
    onMarkMaybe: ((decision: MaybeDecision) => Promise<void>) | undefined
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
  const [pendingKind, setPendingKind] = useState<ReasonedDecisionKind | undefined>(undefined)
  const declineButtonRef = useRef<HTMLButtonElement>(null)
  const maybeButtonRef = useRef<HTMLButtonElement>(null)

  const closeDialog = (): void => {
    const trigger = pendingKind === 'decline' ? declineButtonRef : maybeButtonRef
    setPendingKind(undefined)
    trigger.current?.focus()
  }

  /* Awaited rather than fired and forgotten, so the dialog stays up for as long
     as the write is in the air and comes down once the sheet has answered,
     whichever way it answered. A refusal is on the card underneath by then, and
     a dialog still covering it would be hiding the one thing the reviewer needs
     to read. */
  const takeDecision = async ({
    kind,
    reason,
  }: {
    kind: ReasonedDecisionKind
    reason: string | undefined
  }): Promise<void> => {
    if (kind === 'decline') {
      await onDecline?.({ lead, reason })
    } else {
      await onMarkMaybe?.({ lead, reason })
    }
    closeDialog()
  }

  return (
    <div className={CONTROL_STACK_CLASSES}>
      <div className="flex items-center justify-between gap-3">
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
      </div>
      <div className={DECISION_ROW_CLASSES}>
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
            className={MAYBE_BUTTON_CLASSES}
            disabled={isSaving}
            ref={maybeButtonRef}
            type="button"
            onClick={() => setPendingKind('maybe')}
          >
            Maybe
          </button>
        )}
        {onDecline !== undefined && (
          <button
            className={DECLINE_BUTTON_CLASSES}
            disabled={isSaving}
            ref={declineButtonRef}
            type="button"
            onClick={() => setPendingKind('decline')}
          >
            Decline
          </button>
        )}
      </div>

      {pendingKind !== undefined && (
        <DecisionReasonDialog
          applicantName={lead.name ?? lead.email}
          isSaving={isSaving}
          kind={pendingKind}
          onCancel={closeDialog}
          onSubmit={(reason) => takeDecision({ kind: pendingKind, reason })}
        />
      )}
    </div>
  )
}
