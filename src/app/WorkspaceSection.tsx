import { LeadsSection } from '../features/applications/LeadsSection'
import { EventsSection } from '../features/events/EventsSection'
import type { ResponseSheetAccess } from '../features/events/responseSheetAccess'
import { MembersSection } from '../features/members/MembersSection'
import { OverviewSection } from '../features/overview/OverviewSection'
import type { SheetsClient } from '../sheets/sheetsClient'
import type { Section } from '../shell/section'
import type { EventCountFilter } from '../features/eventHistory/memberEventCounts'
import type { CommunityEventHistoryResource } from '../features/eventHistory/useCommunityEventHistory'

type WorkspaceSectionProps = {
  section: Section
  sheetsClient: SheetsClient
  responseSheetAccess: ResponseSheetAccess
  onSessionExpired: () => void
  onSelectSection: (section: Section) => void
  onWaitingCountRead: (count: number) => void
  eventHistory: CommunityEventHistoryResource
  membersEventCountFilter: EventCountFilter | undefined
  onOpenMembersWithEvents: (filter: EventCountFilter) => void
}

export const WorkspaceSection = ({
  section,
  sheetsClient,
  responseSheetAccess,
  onSessionExpired,
  onSelectSection,
  onWaitingCountRead,
  eventHistory,
  membersEventCountFilter,
  onOpenMembersWithEvents,
}: WorkspaceSectionProps) => {
  if (section === 'overview') {
    return (
      <OverviewSection
        eventHistory={eventHistory}
        onOpenMembersWithEvents={onOpenMembersWithEvents}
        onSessionExpired={onSessionExpired}
        onStartReviewing={() => onSelectSection('leads')}
        onWaitingCountRead={onWaitingCountRead}
        sheetsClient={sheetsClient}
      />
    )
  }

  if (section === 'leads') {
    return (
      <LeadsSection
        onSessionExpired={onSessionExpired}
        onWaitingCountRead={onWaitingCountRead}
        sheetsClient={sheetsClient}
      />
    )
  }

  if (section === 'members') {
    return (
      <MembersSection
        eventHistory={eventHistory}
        initialEventCountFilter={membersEventCountFilter}
        onSessionExpired={onSessionExpired}
        responseSheetAccess={responseSheetAccess}
        sheetsClient={sheetsClient}
      />
    )
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
