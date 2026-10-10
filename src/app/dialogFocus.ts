import type { KeyboardEvent } from 'react'

const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled])'

/* Escape closes, and Tab wraps inside the dialog. Handled by hand rather than
   by hiding the page behind it, because the screen underneath is still mounted
   and its buttons are one Tab away from somebody who cannot see where their
   focus went. */
export const keepFocusInDialog = ({
  keyboardEvent,
  dialog,
  onEscape,
}: {
  keyboardEvent: KeyboardEvent<HTMLElement>
  dialog: HTMLElement | null
  onEscape: () => void
}): void => {
  if (keyboardEvent.key === 'Escape') {
    onEscape()
    return
  }
  if (keyboardEvent.key !== 'Tab') {
    return
  }
  const focusable = [...(dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])]
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

/* A phone has no keyboard until a text field takes focus, and then the
   keyboard covers half the screen. A dialog opened by a tap lands on the
   dialog itself so its quick choices stay in view; one opened from a keyboard
   can go straight to the field. */
export const isTouchFirstDevice = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
