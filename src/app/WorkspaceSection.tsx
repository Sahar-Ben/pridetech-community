import { LeadsSection } from '../features/applications/LeadsSection'
import { EventsSection } from '../features/events/EventsSection'
import type { ResponseSheetAccess } from '../features/events/responseSheetAccess'
import { MembersSection } from '../features/members/MembersSection'
import { OverviewSection } from '../features/overview/OverviewSection'
import type { SheetsClient } from '../sheets/sheetsClient'
import type { Section } from '../shell/section'

type WorkspaceSectionProps = {
  section: Section
  sheetsClient: SheetsClient
  responseSheetAccess: ResponseSheetAccess
  onSessionExpired: () => void
}

export const WorkspaceSection = ({
  section,
  sheetsClient,
  responseSheetAccess,
  onSessionExpired,
}: WorkspaceSectionProps) => {
  if (section === 'overview') {
    return <OverviewSection sheetsClient={sheetsClient} onSessionExpired={onSessionExpired} />
  }

  if (section === 'leads') {
    return <LeadsSection sheetsClient={sheetsClient} onSessionExpired={onSessionExpired} />
  }

  if (section === 'members') {
    return <MembersSection sheetsClient={sheetsClient} onSessionExpired={onSessionExpired} />
  }

  /* No sample-data banner here any more: the events, the tabs they live in and
     the community the door searches are all read from the spreadsheet. What is
     still invented is named on the screens that show it, because it is only
     half of this section rather than all of it. */
  return (
    <EventsSection
      onSessionExpired={onSessionExpired}
      responseSheetAccess={responseSheetAccess}
      sheetsClient={sheetsClient}
    />
  )
}
