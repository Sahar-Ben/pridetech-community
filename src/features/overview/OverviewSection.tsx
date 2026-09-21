import { OverviewDashboard } from './OverviewDashboard'
import { useOverview } from './useOverview'
import { SectionErrorNotice } from '../../app/SectionErrorNotice'
import type { SheetsClient } from '../../sheets/sheetsClient'

type OverviewSectionProps = {
  sheetsClient: SheetsClient
  onSessionExpired: () => void
}

export const OverviewSection = ({ sheetsClient, onSessionExpired }: OverviewSectionProps) => {
  const { state, reload } = useOverview({ sheetsClient, onSessionExpired })

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

  return <OverviewDashboard overview={state.overview} />
}
