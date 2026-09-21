import { useId, useState, type ReactNode } from 'react'

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
        className="text-left underline underline-offset-2 hover:text-slate-900 dark:hover:text-slate-200"
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        type="button"
      >
        {summary}
      </button>
      {isOpen && (
        <div className="mt-2" id={contentId}>
          {children}
        </div>
      )}
    </div>
  )
}
