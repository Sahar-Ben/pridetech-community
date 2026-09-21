import { useState } from 'react'
import { ApplicationCard } from './ApplicationCard'
import {
  isDecliningOffered,
  isMaybeOffered,
  selectApplicationsInView,
  type LeadView,
} from './leadViews'
import type { LeadsReview } from './leadsReview'
import { LeadsDataQualityNotes } from './LeadsDataQualityNotes'
import { describeApplicationsCount, describeEmptyView } from './leadsReviewText'
import { LeadsFilterBar } from './LeadsFilterBar'
import type { LeadDecisions } from './useLeadDecisions'
import { COMPACT_BUTTON_SIZE_CLASSES, SHELL_BUTTON_CLASSES } from '../../theme/controls'
import { EMPTY_STATE_CLASSES, SHELL_SECTION_TITLE_CLASSES } from '../../theme/surfaces'

/* Glass and blur on the strip that follows the scroll, because it carries a
   heading, a count and one button. The 256 cards under it do not. */
const HEADER_CLASSES = [
  'sticky top-0 z-10 -mx-1 flex flex-wrap items-baseline justify-between gap-3',
  'rounded-b-[var(--radius-brand)] border-b border-glass-edge bg-glass px-1 py-3',
  'backdrop-blur-xl',
].join(' ')

const RELOAD_BUTTON_CLASSES = `${SHELL_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type ApplicationsQueueProps = {
  review: LeadsReview
  spreadsheetId: string
  decisions: LeadDecisions
  onReload: () => void
}

/* The queue renders the review exactly as it was computed at read time: the
   filtering, the matching and the ordering all happened once in `buildLeadsReview`,
   so a re-render of 300-odd cards does not redo any of it, and switching views
   picks one of two lists it already holds. */
export const ApplicationsQueue = ({
  review,
  spreadsheetId,
  decisions,
  onReload,
}: ApplicationsQueueProps) => {
  const [view, setView] = useState<LeadView>('Pending')
  const applications = selectApplicationsInView({ review, view })
  const countLine = describeApplicationsCount({ view, counts: review.counts })
  const cardDecisions = {
    onDecline: isDecliningOffered({ view }) ? decisions.decline : undefined,
    onMarkMaybe: isMaybeOffered({ view }) ? decisions.markMaybe : undefined,
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pb-12">
      <header className={HEADER_CLASSES}>
        <h2 className={SHELL_SECTION_TITLE_CLASSES}>Applications</h2>
        <div className="flex flex-wrap items-baseline gap-3">
          {countLine !== undefined && (
            <p className="text-sm font-semibold text-on-brand">{countLine}</p>
          )}
          {/* The reviewer needs this without a failure first: a decision that
              aborted because the sheet moved leaves a card explaining why, and
              the only way forward is to read the sheet again. */}
          <button className={RELOAD_BUTTON_CLASSES} onClick={onReload} type="button">
            Reload applications
          </button>
        </div>
      </header>

      <LeadsDataQualityNotes review={review} spreadsheetId={spreadsheetId} />

      <LeadsFilterBar onViewChange={setView} view={view} />

      {applications.length === 0 ? (
        <p className={EMPTY_STATE_CLASSES}>{describeEmptyView({ view })}</p>
      ) : (
        /* One entrance animation on the list, not 256 of them: the cards are
           the work, and a stagger across them would be a wait before it. */
        <ul className="animate-rise flex flex-col gap-2.5">
          {applications.map((application) => (
            <ApplicationCard
              key={application.lead.rowNumber}
              application={application}
              decisionState={decisions.stateFor(application.lead.rowNumber)}
              onApprove={decisions.approve}
              decisions={cardDecisions}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
