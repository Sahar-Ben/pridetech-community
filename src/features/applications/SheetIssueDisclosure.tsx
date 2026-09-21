import { useId, useState, type ReactNode } from 'react'

const SUMMARY_BUTTON_CLASSES = [
  'rounded-full text-left font-semibold text-on-brand underline underline-offset-4',
  'transition-opacity duration-150 ease-brand hover:opacity-80',
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
        {summary}
      </button>
      {isOpen && (
        <div className="animate-fade mt-2" id={contentId}>
          {children}
        </div>
      )}
    </div>
  )
}
