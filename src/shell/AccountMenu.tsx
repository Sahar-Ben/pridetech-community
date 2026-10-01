import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { WorkspaceAccount } from './workspaceAccount'

/* The two account actions live behind the header's one button rather than in
   the nav: one re-points the whole app and the other ends the session, both
   are used once a day at most, and the bottom bar has room for four thumbs and
   no more. */
const TRIGGER_CLASSES = [
  'flex size-11 items-center justify-center rounded-[14px] border border-card-edge bg-card text-ink',
  'transition-colors duration-150 ease-brand hover:bg-glass-hover',
].join(' ')

const PANEL_CLASSES = [
  'absolute top-[52px] right-0 z-50 flex w-72 flex-col gap-2 rounded-[var(--radius-brand)]',
  'border border-card-strong-edge bg-nav p-3 shadow-[var(--shadow-nav)] animate-rise',
].join(' ')

const CHANGE_BUTTON_CLASSES = [
  'w-full rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-ink',
  'transition-colors duration-150 ease-brand hover:bg-glass-hover',
].join(' ')

/* Outlined where its neighbour is bare. They sit next to each other and one of
   them throws the session away, so they must not be the same object twice. */
const SIGN_OUT_BUTTON_CLASSES = [
  'min-h-11 rounded-2xl border border-danger-edge px-3 text-sm font-semibold text-danger-ink',
  'transition-colors duration-150 ease-brand hover:bg-danger-surface',
].join(' ')

type AccountMenuProps = {
  account: WorkspaceAccount
}

export const AccountMenu = ({ account }: AccountMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const close = useCallback(() => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    panelRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }
    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target as Node
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutsidePress)
    }
  }, [close, isOpen])

  const runAndClose = (action: () => void) => () => {
    setIsOpen(false)
    action()
  }

  return (
    <div className="relative">
      <button
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-label="Account"
        className={TRIGGER_CLASSES}
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        ref={triggerRef}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="20"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          width="20"
        >
          <path d="M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </svg>
      </button>

      {isOpen && (
        <div
          aria-label="Account"
          className={PANEL_CLASSES}
          id={panelId}
          ref={panelRef}
          role="group"
          tabIndex={-1}
        >
          <button
            className={CHANGE_BUTTON_CLASSES}
            onClick={runAndClose(account.onChangeSpreadsheet)}
            type="button"
          >
            Change spreadsheet
            {/* The name of the sheet being written to, under the control that
                changes it: an approval writes for real, and a copy named WRITE
                TEST is only obvious if it is on screen. */}
            {account.spreadsheetName !== undefined && (
              <span className="mt-0.5 block truncate font-mono text-xs font-medium text-ink-muted">
                {account.spreadsheetName}
              </span>
            )}
          </button>
          <button
            className={SIGN_OUT_BUTTON_CLASSES}
            onClick={runAndClose(account.onSignOut)}
            type="button"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
