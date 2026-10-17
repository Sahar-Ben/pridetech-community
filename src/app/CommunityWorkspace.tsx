import { useCallback, useState } from 'react'
import { WorkspaceSection } from './WorkspaceSection'
import type { ScreenLock } from '../lock/useScreenLock'
import type { ResponseSheetAccess } from '../features/events/responseSheetAccess'
import type { SheetsClient } from '../sheets/sheetsClient'
import { AppShell } from '../shell/AppShell'
import { DEFAULT_SECTION, type Section } from '../shell/section'
import type { EventCountFilter } from '../features/eventHistory/memberEventCounts'
import { useCommunityEventHistory } from '../features/eventHistory/useCommunityEventHistory'

type CommunityWorkspaceProps = {
  sheetsClient: SheetsClient
  responseSheetAccess: ResponseSheetAccess
  spreadsheetName: string | undefined
  screenLock?: ScreenLock
  onSessionExpired: () => void
  onChangeSpreadsheet: () => void
  onSignOut: () => void
}

export const CommunityWorkspace = ({
  sheetsClient,
  responseSheetAccess,
  spreadsheetName,
  screenLock,
  onSessionExpired,
  onChangeSpreadsheet,
  onSignOut,
}: CommunityWorkspaceProps) => {
  const [activeSection, setActiveSection] = useState<Section>(DEFAULT_SECTION)
  const [waitingCount, setWaitingCount] = useState<number | undefined>(undefined)
  const [membersEventCountFilter, setMembersEventCountFilter] = useState<
    EventCountFilter | undefined
  >(undefined)
  const account = { spreadsheetName, screenLock, onChangeSpreadsheet, onSignOut }

  /* Every event's registrants, read once for the whole workspace: the
     Overview's events chart and the Members filter count from the same read,
     and moving between them does not spend Google's per-minute allowance on it
     again. */
  const eventHistory = useCommunityEventHistory({
    sheetsClient,
    access: responseSheetAccess,
    onSessionExpired,
  })

  /* Choosing a section from the navigation starts it plain; only a bar on the
     Overview's events chart opens Members already filtered. */
  const selectSection = useCallback((section: Section) => {
    setMembersEventCountFilter(undefined)
    setActiveSection(section)
  }, [])

  const openMembersWithEvents = useCallback((filter: EventCountFilter) => {
    setMembersEventCountFilter(filter)
    setActiveSection('members')
  }, [])

  return (
    <AppShell
      account={account}
      activeSection={activeSection}
      leadsWaitingCount={waitingCount}
      onSelectSection={selectSection}
    >
      <WorkspaceSection
        eventHistory={eventHistory}
        membersEventCountFilter={membersEventCountFilter}
        onOpenMembersWithEvents={openMembersWithEvents}
        onSelectSection={selectSection}
        onSessionExpired={onSessionExpired}
        onWaitingCountRead={setWaitingCount}
        responseSheetAccess={responseSheetAccess}
        section={activeSection}
        sheetsClient={sheetsClient}
      />
    </AppShell>
  )
}
