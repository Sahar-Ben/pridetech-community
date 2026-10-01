import { useId, useRef, useState } from 'react'
import type { ApprovalDecision, DeclineDecision, Gender, MaybeDecision } from './decision'
import { DecisionReasonDialog } from './DecisionReasonDialog'
import type { ReasonedDecisionKind } from './decisionReason'
import type { Lead } from './lead'
import { PRIMARY_BUTTON_CLASSES, SECONDARY_BUTTON_CLASSES } from '../../theme/controls'
import { FIELD_LABEL_CLASSES } from '../../theme/fields'

/* Three native radios drawn as a segmented control: arrow keys move between
   them and a screen reader hears "Gender, radio group" without any ARIA of
   ours. The unknown option shows "?" and is named in full for assistive
   technology. */
const GENDER_GROUP_CLASSES =
  'grid w-[186px] grid-cols-3 gap-1 rounded-[14px] border border-card-edge bg-surface-sunken p-[3px]'

const GENDER_OPTION_CLASSES = [
  'flex min-h-10 cursor-pointer items-center justify-center rounded-[11px] border border-transparent',
  'font-mono text-sm text-neutral-ink transition-colors duration-150 ease-brand',
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ui-focus-ring)]',
  'has-[:checked]:border-accent has-[:checked]:bg-nav-active has-[:checked]:text-accent',
  /* "Not decided yet" is the one choice that should look unfinished, so it
     wears the warning ink while it is the one picked. */
  'has-[:checked[value=unknown]]:border-warning-edge has-[:checked[value=unknown]]:bg-warning-surface',
  'has-[:checked[value=unknown]]:text-warning-ink',
  'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
].join(' ')

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

const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; shown: string; name: string }> = [
  { value: 'F', shown: 'F', name: 'F' },
  { value: 'M', shown: 'M', name: 'M' },
  { value: 'unknown', shown: '?', name: 'Unknown' },
]

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
  const genderGroupName = useId()
  const genderLegendId = useId()
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
      <div
        aria-labelledby={genderLegendId}
        className="flex items-center justify-between gap-3"
        role="radiogroup"
      >
        <span className={FIELD_LABEL_CLASSES} id={genderLegendId}>
          Gender
        </span>
        <div className={GENDER_GROUP_CLASSES}>
          {GENDER_OPTIONS.map((option) => (
            <label className={GENDER_OPTION_CLASSES} key={option.value}>
              <input
                aria-label={option.name}
                checked={gender === option.value}
                className="sr-only"
                disabled={isSaving}
                name={genderGroupName}
                onChange={() => setGender(option.value)}
                type="radio"
                value={option.value}
              />
              <span aria-hidden="true">{option.shown}</span>
            </label>
          ))}
        </div>
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
