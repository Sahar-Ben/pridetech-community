import { useState } from 'react'
import { ApplicationsQueue } from './ApplicationsQueue'
import { ApplicationsReadOnlyNotice } from './ApplicationsReadOnlyNotice'
import { describeUnsavedDecision } from './unsavedDecision'
import { useLeads } from './useLeads'
import type { SheetsClient } from '../../sheets/sheetsClient'

type LeadsSectionProps = {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
}

export const LeadsSection = ({ sheetsClient, onSessionExpired }: LeadsSectionProps) => {
  const { state, reload } = useLeads({ sheetsClient, onSessionExpired })
  const [unsavedDecisionMessage, setUnsavedDecisionMessage] = useState<string | undefined>(
    undefined,
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

  if (state.status === 'failed') {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-10">
        <p
          className="rounded-md border-2 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-200"
          role="alert"
        >
          {state.message}
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
    <div className="flex flex-col gap-3">
      <div className="mx-auto w-full max-w-3xl px-4 pt-4">
        <ApplicationsReadOnlyNotice />
        {unsavedDecisionMessage !== undefined && (
          <p
            className="mt-3 rounded-md border border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-200"
            role="alert"
          >
            {unsavedDecisionMessage}
          </p>
        )}
      </div>

      <ApplicationsQueue
        leads={state.leads}
        onApprove={({ lead }) => {
          setUnsavedDecisionMessage(describeUnsavedDecision({ decision: 'approve', lead }))
        }}
        onDecline={({ lead }) => {
          setUnsavedDecisionMessage(describeUnsavedDecision({ decision: 'decline', lead }))
        }}
      />
    </div>
  )
}
