import { ApplicationCard } from './ApplicationCard'
import type { LeadsReview } from './leadsReview'
import { LeadsDataQualityNotes } from './LeadsDataQualityNotes'
import { describeQueueCount } from './leadsReviewText'
import type { LeadDecisions } from './useLeadDecisions'

type ApplicationsQueueProps = {
  review: LeadsReview
  spreadsheetId: string
  decisions: LeadDecisions
  onReload: () => void
}

/* The queue renders the review exactly as it was computed at read time: the
   filtering, the matching and the ordering all happened once in `buildLeadsReview`,
   so a re-render of 300-odd cards does not redo any of it. */
export const ApplicationsQueue = ({
  review,
  spreadsheetId,
  decisions,
  onReload,
}: ApplicationsQueueProps) => {
  const { waitingApplications, counts } = review
  const hasApplications = counts.waitingCount + counts.alreadyMemberCount > 0

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pb-10">
      <header className="sticky top-0 z-10 flex items-baseline justify-between gap-3 bg-slate-50/90 py-3 backdrop-blur dark:bg-slate-950/90">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Applications</h2>
        <div className="flex items-baseline gap-3">
          {hasApplications && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {describeQueueCount({ counts })}
            </p>
          )}
          {/* The reviewer needs this without a failure first: a decision that
              aborted because the sheet moved leaves a card explaining why, and
              the only way forward is to read the sheet again. */}
          <button
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={onReload}
            type="button"
          >
            Reload applications
          </button>
        </div>
      </header>

      <LeadsDataQualityNotes review={review} spreadsheetId={spreadsheetId} />

      {waitingApplications.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No applications waiting for review.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {waitingApplications.map((application) => (
            <ApplicationCard
              key={application.lead.rowNumber}
              application={application}
              decisionState={decisions.stateFor(application.lead.rowNumber)}
              onApprove={decisions.approve}
              onDecline={decisions.decline}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
