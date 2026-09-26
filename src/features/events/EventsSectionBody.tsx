import { EventsDataQualityNotes } from './EventsDataQualityNotes'
import { EventsRegistryBlockedNotice } from './EventsRegistryBlockedNotice'
import { EventsRegistryNotice } from './EventsRegistryNotice'
import { EventsRegistrySetupScreen } from './EventsRegistrySetupScreen'
import { EventsWorkspace } from './EventsWorkspace'
import { toIsoDateString } from './eventDate'
import type { AttachedResponseSheet } from './parseAttachedSheets'
import type { EventsScreenData } from './readEventsScreen'
import type { ResponseSheetAccess } from './responseSheetAccess'
import { useEventRegistrySetup } from './useEventRegistrySetup'
import { useEventRegistrants } from './useEventRegistrants'
import { useEventRegistryWriter } from './useEventRegistryWriter'
import type { SheetsClient } from '../../sheets/sheetsClient'

const NO_ATTACHED_SHEETS: readonly AttachedResponseSheet[] = []

type EventsSectionBodyProps = {
  data: EventsScreenData
  sheetsClient: SheetsClient
  responseSheetAccess: ResponseSheetAccess
  onSessionExpired: () => void
  onReload: () => void
}

export const EventsSectionBody = ({
  data,
  sheetsClient,
  responseSheetAccess,
  onSessionExpired,
  onReload,
}: EventsSectionBodyProps) => {
  const setup = useEventRegistrySetup({ sheetsClient, onSessionExpired, onSetUp: onReload })
  const writer = useEventRegistryWriter({ sheetsClient, onSessionExpired, onWritten: onReload })
  const registrants = useEventRegistrants({
    access: responseSheetAccess,
    attachedSheets: data.kind === 'ready' ? data.registry.attachedSheets : NO_ATTACHED_SHEETS,
    onSessionExpired,
  })

  if (data.kind === 'blocked') {
    return <EventsRegistryBlockedNotice onRetry={onReload} plans={data.plans} />
  }

  if (data.kind === 'setup-needed') {
    return (
      <EventsRegistrySetupScreen
        errorMessage={setup.errorMessage}
        isSettingUp={setup.isRunning}
        onSetUp={() => setup.run(data.plans)}
        plans={data.plans}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <EventsRegistryNotice />
      <EventsDataQualityNotes
        attachedSheetIssues={data.registry.attachedSheetIssues}
        eventIssues={data.registry.eventIssues}
      />
      <EventsWorkspace
        attachedSheets={data.registry.attachedSheets}
        events={data.registry.events}
        members={data.members}
        onReloadRegistrants={registrants.reload}
        onRequestRegistrants={registrants.request}
        registrantLoads={registrants.loads}
        responseSheetAccess={responseSheetAccess}
        today={toIsoDateString(new Date())}
        writer={writer}
      />
    </div>
  )
}

