import { useEffect } from 'react'
import { OverviewDashboard } from './OverviewDashboard'
import { useOverview } from './useOverview'
import { SectionErrorNotice } from '../../app/SectionErrorNotice'
import type { SheetsClient } from '../../sheets/sheetsClient'

type OverviewSectionProps = {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
  onStartReviewing?: () => void
  onWaitingCountRead?: (count: number) => void
}

const ignore = () => undefined

export const OverviewSection = ({
  sheetsClient,
  onSessionExpired,
  onStartReviewing = ignore,
  onWaitingCountRead,
}: OverviewSectionProps) => {
  const { state, reload } = useOverview({ sheetsClient, onSessionExpired })
  const waitingCount =
    state.status === 'ready' ? state.overview.applications.waitingCount : undefined

  /* The nav's Leads badge is filled from whichever screen read the queue last,
     so it costs no read of its own. */
  useEffect(() => {
    if (waitingCount !== undefined) {
      onWaitingCountRead?.(waitingCount)
    }
  }, [onWaitingCountRead, waitingCount])

  if (state.status === 'loading') {
    return (
      <p className="mx-auto w-full max-w-4xl px-4 py-10 text-on-brand" role="status">
        Reading the community from the Members and Leads tabs...
      </p>
    )
  }

  if (state.status === 'failed') {
    return <SectionErrorNotice message={state.message} onRetry={reload} />
  }

  return <OverviewDashboard onStartReviewing={onStartReviewing} overview={state.overview} />
}
