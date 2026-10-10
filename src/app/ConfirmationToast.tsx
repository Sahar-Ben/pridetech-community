import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/* Clear of the bottom nav on a phone (70px tall, floating over the safe
   area), and in the bottom corner beside the rail from `md` up. */
const TOAST_CLASSES = [
  'fixed z-50 flex items-center gap-3 rounded-[var(--radius-brand)] border-2 px-4 py-2 shadow-data',
  'border-success-edge bg-success-surface text-success-ink animate-rise',
  'inset-x-4 bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+78px)]',
  'md:inset-x-auto md:right-6 md:bottom-6 md:w-96',
].join(' ')

const DISMISS_BUTTON_CLASSES =
  'flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold hover:bg-glass-hover'

/* Long enough to read twice, short enough to be gone before the next card
   has been read. */
const VISIBLE_FOR_MS = 6000

type ConfirmationToastProps = {
  /* Changes with every message, so the same sentence twice is shown twice. */
  messageKey: number
  message: string
  onDismiss: () => void
}

/* Says a write the sheet has confirmed, once its card or form has gone and
   nothing else on screen would. It never asks for anything. */
export const ConfirmationToast = ({ messageKey, message, onDismiss }: ConfirmationToastProps) => {
  useEffect(() => {
    const timeout = setTimeout(onDismiss, VISIBLE_FOR_MS)
    return () => {
      clearTimeout(timeout)
    }
  }, [messageKey, onDismiss])

  return createPortal(
    <div className={TOAST_CLASSES} role="status">
      <span aria-hidden="true" className="text-lg">
        {'\u{2713}'}
      </span>
      <p className="min-w-0 flex-1 text-sm font-bold wrap-anywhere">{message}</p>
      <button className={DISMISS_BUTTON_CLASSES} onClick={onDismiss} type="button">
        <span aria-hidden="true">{'\u{00d7}'}</span>
        <span className="sr-only">Dismiss</span>
      </button>
    </div>,
    document.body,
  )
}
