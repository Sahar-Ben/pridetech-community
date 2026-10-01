import { useId, useState, type ReactNode } from 'react'

/* The warning banner from the design: amber on its own dark amber surface
   (12:1), a triangle before the sentence and a chevron that turns when the
   rows are open. */
const SUMMARY_BUTTON_CLASSES = [
  'flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-warning-edge',
  'bg-warning-surface px-3.5 py-3 text-left text-sm text-warning-ink',
  'transition-[filter] duration-150 ease-brand hover:brightness-125',
].join(' ')

type SheetIssueDisclosureProps = {
  summary: string
  children: ReactNode
}

/* The note itself is the control, so the count the reviewer is reading is the
   thing they click. The rows stay unmounted until then: on the real sheet the
   repeated addresses run to 69 groups of links nobody asked to see yet. */
export const SheetIssueDisclosure = ({ summary, children }: SheetIssueDisclosureProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const contentId = useId()

  return (
    <div>
      <button
        aria-controls={contentId}
        aria-expanded={isOpen}
        className={SUMMARY_BUTTON_CLASSES}
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="shrink-0"
          fill="none"
          height="20"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          width="20"
        >
          <path d="M12 3l10 18H2z" />
          <path d="M12 10v5" />
          <path d="M12 18h.01" />
        </svg>
        <span className="grow">{summary}</span>
        <svg
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-150 ease-brand ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          height="18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="18"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
      {isOpen && (
        <div className="animate-fade mt-2 px-1" id={contentId}>
          {children}
        </div>
      )}
    </div>
  )
}
