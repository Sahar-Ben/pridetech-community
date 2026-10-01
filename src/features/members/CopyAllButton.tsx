import { useEffect, useRef, useState } from 'react'
import { copyText } from '../../app/clipboard'
import { SECONDARY_BUTTON_CLASSES } from '../../theme/controls'

const COPIED_FOR_MS = 1800

const BUTTON_CLASSES = `${SECONDARY_BUTTON_CLASSES} min-h-11 w-full px-4 text-sm`

type CopyAllButtonProps = {
  text: string
}

/* Copies the whole contact summary at once -- name, role, email, phone,
   LinkedIn, city -- for pasting into a message or a note. */
export const CopyAllButton = ({ text }: CopyAllButtonProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const copy = async () => {
    const didCopy = await copyText(text)
    setIsCopied(didCopy)
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setIsCopied(false), COPIED_FOR_MS)
  }

  return (
    <button
      className={`${BUTTON_CLASSES} ${isCopied ? 'border-success-edge text-success-ink' : ''}`}
      onClick={() => {
        void copy()
      }}
      type="button"
    >
      <svg
        aria-hidden="true"
        fill="none"
        height="16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
        width="16"
      >
        {isCopied ? (
          <path d="M5 12l5 5L20 7" />
        ) : (
          <>
            <rect height="12" rx="2.5" width="12" x="9" y="9" />
            <path d="M5 15V6a2 2 0 0 1 2-2h9" />
          </>
        )}
      </svg>
      <span aria-live="polite">
        {isCopied ? 'Copied contact details' : 'Copy all contact details'}
      </span>
    </button>
  )
}
