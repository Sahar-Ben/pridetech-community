import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import {
  isReasonChipSelected,
  REASON_CHIPS,
  toDecisionReason,
  toggleReasonChip,
  type ReasonedDecisionKind,
} from './decisionReason'
import { describeReasonPrompt } from './decisionReasonText'
import {
  COMPACT_BUTTON_SIZE_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from '../../theme/controls'
import { FIELD_BORDER_CLASSES, FIELD_CONTROL_CLASSES, FIELD_LABEL_CLASSES } from '../../theme/fields'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

const CLOSE_GLYPH = '\u{00d7}'

const SCRIM_CLASSES = [
  'fixed inset-0 z-40 flex items-center justify-center p-4',
  'bg-[rgb(9_6_24/0.55)] backdrop-blur-sm animate-fade',
].join(' ')

const DIALOG_CLASSES = `${WORK_PANEL_CLASSES} flex w-full max-w-md flex-col gap-4 px-5 py-4`

/* The same shape as the view chips above the queue, and deliberately not the
   same component: those are a tablist, where one choice is always current and
   the arrow keys move between them. These are toggles, any number of them at
   once, and borrowing the tablist semantics would have told a screen reader the
   reviewer was changing which list they were reading. */
const CHIP_CLASSES = [
  'rounded-full border px-3 py-1 text-sm font-semibold',
  'transition-colors duration-150 ease-brand',
].join(' ')

const SELECTED_CHIP_CLASSES = 'border-accent-solid bg-accent-solid text-on-accent'

const UNSELECTED_CHIP_CLASSES = 'border-edge bg-surface text-ink hover:bg-surface-sunken'

const CLOSE_BUTTON_CLASSES = [
  'rounded-full border border-edge bg-surface px-2 py-0.5 text-base font-bold text-ink',
  'transition-colors duration-150 ease-brand hover:bg-surface-sunken',
].join(' ')

const SKIP_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const APPLY_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

const REASON_FIELD_CLASSES = `${FIELD_CONTROL_CLASSES} ${FIELD_BORDER_CLASSES}`

const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled])'

type DecisionReasonDialogProps = {
  kind: ReasonedDecisionKind
  applicantName: string
  isSaving: boolean
  onCancel: () => void
  onSubmit: (reason: string | undefined) => void
}

/* Nothing is written until the reviewer says so here, and cancelling writes
   nothing at all: the application is left undecided, exactly as it was before
   the button was pressed. Skip is not a cancel — it is the decision without a
   reason, which is the case the owner asked for by name. */
export const DecisionReasonDialog = ({
  kind,
  applicantName,
  isSaving,
  onCancel,
  onSubmit,
}: DecisionReasonDialogProps) => {
  const headingId = useId()
  const reasonFieldId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const reasonFieldRef = useRef<HTMLInputElement>(null)
  const [reason, setReason] = useState('')

  /* The field rather than the dialog itself: the reviewer opened this to write a
     sentence, and landing on the text they came to type saves them a Tab while
     still putting focus inside the trap. */
  useEffect(() => {
    reasonFieldRef.current?.focus()
  }, [])

  const appliedReason = toDecisionReason(reason)

  /* Tab is handled here rather than by hiding the page behind the dialog,
     because the card underneath is still mounted and its Approve button is one
     Tab away from a reviewer who cannot see where their focus went. */
  const keepFocusInDialog = (keyboardEvent: KeyboardEvent<HTMLDivElement>): void => {
    if (keyboardEvent.key === 'Escape') {
      onCancel()
      return
    }
    if (keyboardEvent.key !== 'Tab') {
      return
    }
    const focusable = [
      ...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []),
    ]
    const first = focusable[0]
    const last = focusable.at(-1)
    if (first === undefined || last === undefined) {
      return
    }
    if (keyboardEvent.shiftKey && document.activeElement === first) {
      keyboardEvent.preventDefault()
      last.focus()
      return
    }
    if (!keyboardEvent.shiftKey && document.activeElement === last) {
      keyboardEvent.preventDefault()
      first.focus()
    }
  }

  return (
    <div className={SCRIM_CLASSES}>
      <div
        aria-labelledby={headingId}
        aria-modal="true"
        className={DIALOG_CLASSES}
        onKeyDown={keepFocusInDialog}
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-ink" id={headingId}>
            {describeReasonPrompt({ kind, applicantName })}
          </h2>
          <button
            className={CLOSE_BUTTON_CLASSES}
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            <span aria-hidden="true">{CLOSE_GLYPH}</span>
            <span className="sr-only">Close without deciding</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {REASON_CHIPS[kind].map((chip) => {
            const isSelected = isReasonChipSelected({ reason, chip })
            return (
              <button
                aria-pressed={isSelected}
                className={`${CHIP_CLASSES} ${isSelected ? SELECTED_CHIP_CLASSES : UNSELECTED_CHIP_CLASSES}`}
                disabled={isSaving}
                key={chip}
                onClick={() => setReason(toggleReasonChip({ reason, chip }))}
                type="button"
              >
                {chip}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-1">
          <label className={FIELD_LABEL_CLASSES} htmlFor={reasonFieldId}>
            Reason
          </label>
          <input
            className={REASON_FIELD_CLASSES}
            disabled={isSaving}
            id={reasonFieldId}
            onChange={(changeEvent) => setReason(changeEvent.target.value)}
            ref={reasonFieldRef}
            type="text"
            value={reason}
          />
        </div>

        {isSaving && (
          <p className="text-xs font-semibold text-ink-muted" role="status">
            Saving the decision...
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            className={SKIP_BUTTON_CLASSES}
            disabled={isSaving}
            onClick={() => onSubmit(undefined)}
            type="button"
          >
            Skip
          </button>
          <button
            className={APPLY_BUTTON_CLASSES}
            disabled={isSaving || appliedReason === undefined}
            onClick={() => onSubmit(appliedReason)}
            type="button"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
