import { useCallback, useEffect, useMemo } from 'react'
import { ApplicationsQueue } from './ApplicationsQueue'
import { withoutDecidedApplications } from './decidedApplications'
import type { DuplicateApplicant } from './duplicateApplicants'
import { markLeadsDuplicate } from './markLeadsDuplicate'
import { useLeadDecisions } from './useLeadDecisions'
import { useLeads } from './useLeads'
import { SectionErrorNotice } from '../../app/SectionErrorNotice'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { isExpiredSessionError } from '../../sheets/sheetsRequestError'

type LeadsSectionProps = {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
  onWaitingCountRead?: (count: number) => void
}

export const LeadsSection = ({
  sheetsClient,
  onSessionExpired,
  onWaitingCountRead,
}: LeadsSectionProps) => {
  const { state, reload } = useLeads({ sheetsClient, onSessionExpired })
  const decisions = useLeadDecisions({ sheetsClient, onSessionExpired })
  const loadedReview = state.status === 'ready' ? state.review : undefined
  const { forgetDecisions } = decisions

  /* The tab is read again once every row is marked, which is what takes the
     address off the list. A refusal leaves the dialog up with its reason
     instead: reading the tab would take the dialog down with it, and trying
     again is safe, since a row already marked Duplicate is only marked again. */
  const markDuplicates = useCallback(
    async (duplicate: DuplicateApplicant): Promise<void> => {
      try {
        await markLeadsDuplicate({ sheetsClient, duplicate })
      } catch (error: unknown) {
        if (isExpiredSessionError(error)) {
          onSessionExpired()
        }
        throw error
      }
      reload()
    },
    [onSessionExpired, reload, sheetsClient],
  )

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

  /* Read after the decisions taken here are subtracted, so the nav's badge
     counts down as the queue is worked. */
  const waitingCount = review?.counts.waitingCount
  useEffect(() => {
    if (waitingCount !== undefined) {
      onWaitingCountRead?.(waitingCount)
    }
  }, [onWaitingCountRead, waitingCount])

  if (state.status === 'loading') {
    return (
      <p
        className="mx-auto w-full max-w-4xl px-4 py-10 text-on-brand"
        role="status"
      >
        Reading applications from the Leads tab...
      </p>
    )
  }

  if (state.status === 'failed' || review === undefined) {
    return (
      <SectionErrorNotice
        message={state.status === 'failed' ? state.message : 'The applications could not be read.'}
        onRetry={reload}
      />
    )
  }

  return (
    <ApplicationsQueue
      review={review}
      spreadsheetId={sheetsClient.spreadsheetId}
      decisions={decisions}
      onMarkDuplicates={markDuplicates}
      onReload={reload}
    />
  )
}
