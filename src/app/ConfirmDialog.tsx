import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { keepFocusInDialog } from './dialogFocus'
import { NoticeBanner } from './NoticeBanner'
import {
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
  TOUCH_BUTTON_SIZE_CLASSES,
} from '../theme/controls'
import { WORK_PANEL_CLASSES } from '../theme/surfaces'

/* Above the bottom nav (z-40); anchored to the bottom on a phone, where the
   thumb is, and centred from `sm` up, like the decision dialog. */
const SCRIM_CLASSES = [
  'fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4',
  'bg-[rgb(4_3_10/0.7)] backdrop-blur-sm animate-fade',
].join(' ')

const DIALOG_CLASSES = `${WORK_PANEL_CLASSES} flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col gap-4 overflow-y-auto overscroll-contain rounded-[var(--radius-brand)] px-5 py-5`

const CANCEL_BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

const CONFIRM_BUTTON_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

type ConfirmDialogProps = {
  title: string
  children: ReactNode
  confirmLabel: string
  busyLabel: string
  cancelLabel: string
  isBusy: boolean
  errorMessage: string | undefined
  onConfirm: () => void
  onCancel: () => void
}

/* For the one-tap writes that are hard to take back. Focus starts on the safe
   choice, so a second tap or an Enter that was meant for the button underneath
   does not confirm anything. The dialog stays up while the write is in the
   air and says why if it fails. */
export const ConfirmDialog = ({
  title,
  children,
  confirmLabel,
  busyLabel,
  cancelLabel,
  isBusy,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const headingId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelButtonRef.current?.focus()
  }, [])

  const cancelUnlessBusy = () => {
    if (!isBusy) {
      onCancel()
    }
  }

  return createPortal(
    <div className={SCRIM_CLASSES}>
      <div
        aria-labelledby={headingId}
        aria-modal="true"
        className={DIALOG_CLASSES}
        onKeyDown={(keyboardEvent) =>
          keepFocusInDialog({ keyboardEvent, dialog: dialogRef.current, onEscape: cancelUnlessBusy })
        }
        ref={dialogRef}
        role="dialog"
      >
        <h2 className="text-lg font-bold text-ink" id={headingId}>
          {title}
        </h2>
        <div className="flex flex-col gap-2 text-sm text-ink">{children}</div>

        {errorMessage !== undefined && (
          <NoticeBanner role="alert" title={errorMessage} tone="danger" />
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            className={CANCEL_BUTTON_CLASSES}
            disabled={isBusy}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={CONFIRM_BUTTON_CLASSES}
            disabled={isBusy}
            onClick={onConfirm}
            type="button"
          >
            {isBusy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
