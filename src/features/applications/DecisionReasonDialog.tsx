import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { isTouchFirstDevice, keepFocusInDialog } from '../../app/dialogFocus'
import {
  isReasonChipSelected,
  REASON_CHIPS,
  toDecisionReason,
  toggleReasonChip,
  type ReasonedDecisionKind,
} from './decisionReason'
import { describeDecisionButtons, describeReasonPrompt } from './decisionReasonText'
import {
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
  TOUCH_BUTTON_SIZE_CLASSES,
} from '../../theme/controls'
import {
  FIELD_BORDER_CLASSES,
  FIELD_CONTROL_CLASSES,
  FIELD_LABEL_CLASSES,
} from '../../theme/fields'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

const CLOSE_GLYPH = '\u{00d7}'

/* Above the bottom nav (z-40), which would otherwise cover the dialog's
   buttons; anchored to the bottom on a phone, where the thumb is, and centred
   from `sm` up. */
const SCRIM_CLASSES = [
  'fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4',
  'bg-[rgb(4_3_10/0.7)] backdrop-blur-sm animate-fade',
].join(' ')

/* Never taller than the screen: on a short phone it scrolls inside itself
   rather than pushing its buttons off the bottom. */
const DIALOG_CLASSES = `${WORK_PANEL_CLASSES} flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col gap-4 overflow-y-auto overscroll-contain rounded-[var(--radius-brand)] px-5 py-4 focus:outline-none`

/* The same shape as the view chips above the queue, and deliberately not the
   same component: those are a tablist, where one choice is always current and
   the arrow keys move between them. These are toggles, any number of them at
   once, and borrowing the tablist semantics would have told a screen reader the
   reviewer was changing which list they were reading. Thumb-sized, because on
   a phone the chips are the quick way through and a typed reason is the
   exception. */
const CHIP_CLASSES = [
  'min-h-11 rounded-full border px-3.5 py-2 text-sm font-semibold',
  'transition-colors duration-150 ease-brand',
].join(' ')

const SELECTED_CHIP_CLASSES = 'border-accent-solid bg-accent-solid text-on-accent'

const UNSELECTED_CHIP_CLASSES = 'border-edge bg-surface text-ink hover:bg-surface-sunken'

const CLOSE_BUTTON_CLASSES = [
  'flex size-11 shrink-0 items-center justify-center rounded-full border border-edge bg-surface text-lg font-bold text-ink',
  'transition-colors duration-150 ease-brand hover:bg-surface-sunken',
].join(' ')

const DECISION_BUTTON_SIZE_CLASSES = `${TOUCH_BUTTON_SIZE_CLASSES} px-3 text-[15px] leading-tight`

const SKIP_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${DECISION_BUTTON_SIZE_CLASSES}`

const APPLY_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${DECISION_BUTTON_SIZE_CLASSES}`

const REASON_FIELD_CLASSES = `${FIELD_CONTROL_CLASSES} ${FIELD_BORDER_CLASSES}`

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
   reason, which is the case the owner asked for by name. Both buttons say the
   decision they take, so neither reads as "close this". */
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
     still putting focus inside the trap. Not on a phone, where focusing the
     field raises a keyboard over the chips that are the quick way through. */
  useEffect(() => {
    if (isTouchFirstDevice()) {
      dialogRef.current?.focus()
      return
    }
    reasonFieldRef.current?.focus()
  }, [])

  const appliedReason = toDecisionReason(reason)
  const buttons = describeDecisionButtons(kind)

  /* Rendered at the end of the page rather than where it is declared: a card
     in the list is animated in, and an animated ancestor becomes the frame a
     `fixed` element is placed in, which trapped the dialog inside one card. */
  return createPortal(
    <div className={SCRIM_CLASSES}>
      <div
        aria-labelledby={headingId}
        aria-modal="true"
        className={DIALOG_CLASSES}
        onKeyDown={(keyboardEvent) =>
          keepFocusInDialog({ keyboardEvent, dialog: dialogRef.current, onEscape: onCancel })
        }
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
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
            Reason (optional)
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

        <div className="grid grid-cols-2 gap-2">
          <button
            className={SKIP_BUTTON_CLASSES}
            disabled={isSaving}
            onClick={() => onSubmit(undefined)}
            type="button"
          >
            {buttons.withoutReason}
          </button>
          <button
            className={APPLY_BUTTON_CLASSES}
            disabled={isSaving || appliedReason === undefined}
            onClick={() => onSubmit(appliedReason)}
            type="button"
          >
            {buttons.withReason}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
