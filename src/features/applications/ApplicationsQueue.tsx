import { ApplicationCard } from './ApplicationCard'
import type { ApprovalDecision, DeclineDecision } from './decision'
import type { Lead } from './lead'

type ApplicationsQueueProps = {
  leads: readonly Lead[]
  onApprove: (decision: ApprovalDecision) => void
  onDecline: (decision: DeclineDecision) => void
}

export const ApplicationsQueue = ({ leads, onApprove, onDecline }: ApplicationsQueueProps) => {
  const pendingLeads = leads
    .filter((lead) => lead.status === 'pending')
    .toSorted((earlier, later) => earlier.rowNumber - later.rowNumber)

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-10">
      <header className="sticky top-0 z-10 flex items-baseline justify-between gap-3 bg-slate-50/90 py-3 backdrop-blur dark:bg-slate-950/90">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Applications</h2>
        {pendingLeads.length > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {pendingLeads.length} waiting
          </p>
        )}
      </header>

      {pendingLeads.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No applications waiting for review.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pendingLeads.map((lead) => (
            <ApplicationCard
              key={lead.rowNumber}
              lead={lead}
              onApprove={onApprove}
              onDecline={onDecline}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
