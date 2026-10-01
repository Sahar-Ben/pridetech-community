import { useEffect, useRef, useState } from 'react'
import { copyText } from './clipboard'

const COPIED_FOR_MS = 1600

const BUTTON_CLASSES = [
  'inline-flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-card-strong-edge',
  'bg-surface text-ink-muted transition-colors duration-150 ease-brand hover:bg-surface-raised hover:text-ink',
].join(' ')

const COPIED_CLASSES = 'border-success-edge bg-success-surface text-success-ink'

type CopyButtonProps = {
  text: string
  /* What is being copied, for the button's name: "email", "phone". */
  label: string
  className?: string
}

/* An icon button that copies one value and says so: the icon turns into a
   tick for a moment, and a screen reader hears "Copied email". */
export const CopyButton = ({ text, label, className = '' }: CopyButtonProps) => {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const copy = async () => {
    const didCopy = await copyText(text)
    setState(didCopy ? 'copied' : 'failed')
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setState('idle'), COPIED_FOR_MS)
  }

  return (
    <button
      aria-label={`Copy ${label}`}
      className={`${BUTTON_CLASSES} ${state === 'copied' ? COPIED_CLASSES : ''} ${className}`}
      onClick={() => {
        void copy()
      }}
      title={`Copy ${label}`}
      type="button"
    >
      <svg
        aria-hidden="true"
        fill="none"
        height="18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
        width="18"
      >
        {state === 'copied' ? (
          <path d="M5 12l5 5L20 7" />
        ) : (
          <>
            <rect height="12" rx="2.5" width="12" x="9" y="9" />
            <path d="M5 15V6a2 2 0 0 1 2-2h9" />
          </>
        )}
      </svg>
      <span aria-live="polite" className="sr-only">
        {state === 'copied'
          ? `Copied ${label}`
          : state === 'failed'
            ? `Could not copy ${label}`
            : ''}
      </span>
    </button>
  )
}
