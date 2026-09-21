import { useEffect, useMemo } from 'react'
import { ApplicationsQueue } from './ApplicationsQueue'
import { withoutDecidedApplications } from './decidedApplications'
import { useLeadDecisions } from './useLeadDecisions'
import { useLeads } from './useLeads'
import type { SheetsClient } from '../../sheets/sheetsClient'

type LeadsSectionProps = {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
}

export const LeadsSection = ({ sheetsClient, onSessionExpired }: LeadsSectionProps) => {
  const { state, reload } = useLeads({ sheetsClient, onSessionExpired })
  const decisions = useLeadDecisions({ sheetsClient, onSessionExpired })
  const loadedReview = state.status === 'ready' ? state.review : undefined
  const { forgetDecisions } = decisions

  /* Decisions are remembered by sheet row number, and a fresh read can hand the
     same number to a different person. */
  useEffect(() => {
    forgetDecisions()
  }, [forgetDecisions, loadedReview])

  const review = useMemo(
    () =>
      loadedReview === undefined
        ? undefined
        : withoutDecidedApplications({
            review: loadedReview,
            decidedRowNumbers: decisions.decidedRowNumbers,
          }),
    [decisions.decidedRowNumbers, loadedReview],
  )

  if (state.status === 'loading') {
    return (
      <p
        className="mx-auto w-full max-w-3xl px-4 py-10 text-sm text-slate-500 dark:text-slate-400"
        role="status"
      >
        Reading applications from the Leads tab...
      </p>
    )
  }

  if (state.status === 'failed' || review === undefined) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-10">
        <p
          className="rounded-md border-2 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-200"
          role="alert"
        >
          {state.status === 'failed' ? state.message : 'The applications could not be read.'}
        </p>
        <button
          className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={reload}
          type="button"
        >
          Try again
        </button>
      </section>
    )
  }

  return (
    <ApplicationsQueue
      review={review}
      spreadsheetId={sheetsClient.spreadsheetId}
      decisions={decisions}
      onReload={reload}
    />
  )
}
