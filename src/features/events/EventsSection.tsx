import { EventsSectionBody } from './EventsSectionBody'
import type { ResponseSheetAccess } from './responseSheetAccess'
import { useEventsScreen } from './useEventsScreen'
import { SectionErrorNotice } from '../../app/SectionErrorNotice'
import type { SheetsClient } from '../../sheets/sheetsClient'
import { SHELL_SECTION_TITLE_CLASSES } from '../../theme/surfaces'

const SECTION_CLASSES = 'mx-auto w-full max-w-4xl px-4 pb-12'

type EventsSectionProps = {
  sheetsClient: SheetsClient
  responseSheetAccess: ResponseSheetAccess
  onSessionExpired: () => void
}

export const EventsSection = ({
  sheetsClient,
  responseSheetAccess,
  onSessionExpired,
}: EventsSectionProps) => {
  const { state, reload } = useEventsScreen({ sheetsClient, onSessionExpired })

  if (state.status === 'loading') {
    return (
      <p className="mx-auto w-full max-w-4xl px-4 py-10 text-on-brand" role="status">
        Reading the events from your spreadsheet...
      </p>
    )
  }

  if (state.status === 'failed') {
    return <SectionErrorNotice message={state.message} onRetry={reload} />
  }

  return (
    <section className={SECTION_CLASSES}>
      <header className="py-3">
        <h2 className={SHELL_SECTION_TITLE_CLASSES}>Events</h2>
      </header>
      <EventsSectionBody
        data={state.data}
        onReload={reload}
        onSessionExpired={onSessionExpired}
        responseSheetAccess={responseSheetAccess}
        sheetsClient={sheetsClient}
      />
    </section>
  )
}
