import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { ApplicationCard } from './ApplicationCard'
import {
  isDecliningOffered,
  isMaybeOffered,
  selectApplicationsInView,
  toViewChipId,
  type LeadView,
} from './leadViews'
import type { LeadsReview } from './leadsReview'
import { LeadsDataQualityNotes } from './LeadsDataQualityNotes'
import { describeApplicationsCount, describeEmptyView } from './leadsReviewText'
import { LeadsFilterChips } from './LeadsFilterChips'
import { LeadsFilterSheet } from './LeadsFilterSheet'
import {
  applyLeadListQuery,
  EMPTY_LEAD_LIST_QUERY,
  listCityOptions,
  listInterestOptions,
  type LeadListQuery,
} from './leadListQuery'
import { LeadsToolbar } from './LeadsToolbar'
import type { LeadDecisions } from './useLeadDecisions'
import { SectionTitle } from '../../app/SectionTitle'
import { COMPACT_BUTTON_SIZE_CLASSES, SHELL_BUTTON_CLASSES } from '../../theme/controls'
import { EMPTY_STATE_CLASSES } from '../../theme/surfaces'

/* Glass and blur on the strip that follows the scroll, because it carries a
   heading, a count and one button. The 256 cards under it do not. */
const HEADER_CLASSES = 'flex flex-col gap-3 pt-6'

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
  const [query, setQuery] = useState<LeadListQuery>(EMPTY_LEAD_LIST_QUERY)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const baseId = useId()
  const panelId = `${baseId}-list`
  const applicationsInView = selectApplicationsInView({ review, view })
  /* The query follows the reviewer from tab to tab: a city they are working
     through is still the city when they look at who was kept for later. */
  const applications = useMemo(
    () => applyLeadListQuery({ applications: applicationsInView, query }),
    [applicationsInView, query],
  )
  const cityOptions = useMemo(() => listCityOptions(applicationsInView), [applicationsInView])
  const interestOptions = useMemo(
    () => listInterestOptions(applicationsInView),
    [applicationsInView],
  )
  const clearQuery = useCallback(() => setQuery(EMPTY_LEAD_LIST_QUERY), [])
  /* Focus goes back to the button that opened the sheet, which lives in the
     toolbar; it is found there rather than threaded through as a ref. */
  const closeSheet = useCallback(() => {
    setIsSheetOpen(false)
    toolbarRef.current?.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')?.focus()
  }, [])
  const countLine = describeApplicationsCount({ view, counts: review.counts })
  const cardDecisions = {
    onDecline: isDecliningOffered({ view }) ? decisions.decline : undefined,
    onMarkMaybe: isMaybeOffered({ view }) ? decisions.markMaybe : undefined,
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pb-12">
      <header className={HEADER_CLASSES}>
        <SectionTitle eyebrow="Leads" title="Applications" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {countLine !== undefined && <p className="text-sm text-ink-muted">{countLine}</p>}
          {/* The reviewer needs this without a failure first: a decision that
              aborted because the sheet moved leaves a card explaining why, and
              the only way forward is to read the sheet again. */}
          <button className={RELOAD_BUTTON_CLASSES} onClick={onReload} type="button">
            Reload applications
          </button>
        </div>
      </header>

      <LeadsDataQualityNotes review={review} spreadsheetId={spreadsheetId} />

      <LeadsFilterChips
        baseId={baseId}
        counts={review.counts}
        onViewChange={setView}
        panelId={panelId}
        view={view}
      />

      <div ref={toolbarRef}>
        <LeadsToolbar
          isSheetOpen={isSheetOpen}
          onClearAll={clearQuery}
          onOpenSheet={() => setIsSheetOpen(true)}
          onQueryChange={setQuery}
          query={query}
          shownCount={applications.length}
          totalCount={applicationsInView.length}
        />
      </div>

      {isSheetOpen && (
        <LeadsFilterSheet
          cityOptions={cityOptions}
          interestOptions={interestOptions}
          onClearAll={clearQuery}
          onClose={closeSheet}
          onQueryChange={setQuery}
          query={query}
          resultCount={applications.length}
        />
      )}

      <div aria-labelledby={toViewChipId({ baseId, view })} id={panelId} role="tabpanel">
        {applicationsInView.length === 0 ? (
          <p className={EMPTY_STATE_CLASSES}>{describeEmptyView({ view })}</p>
        ) : applications.length === 0 ? (
          <div className={`${EMPTY_STATE_CLASSES} flex flex-col items-center gap-3`}>
            <p>No applications match this search and these filters.</p>
            <button
              className="min-h-11 rounded-2xl px-4 font-semibold text-accent hover:bg-surface"
              onClick={clearQuery}
              type="button"
            >
              Clear all
            </button>
          </div>
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
      </div>
    </section>
  )
}
